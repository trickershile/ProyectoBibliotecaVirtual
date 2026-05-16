from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import List
from ...core.database import mongo_db
from ...core.security import get_current_profile
from ...schemas.order import OrderCreate, OrderOut
from bson import ObjectId
from pymongo.errors import PyMongoError
from datetime import datetime
from fpdf import FPDF
import os
import uuid

router = APIRouter()

RECEIPTS_DIR = "uploads/receipts"

class ReceiptPDF(FPDF):
    def header(self):
        self.set_font('Courier', 'B', 15)
        self.cell(0, 10, 'BIBLIOTECA VIRTUAL - COMPROBANTE DE SOLICITUD', 0, 1, 'C')
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('Courier', 'I', 8)
        self.cell(0, 10, f'Pagina {self.page_no()}', 0, 0, 'C')

def generate_receipt_pdf(order_data: dict, filename: str):
    pdf = ReceiptPDF()
    pdf.add_page()
    pdf.set_font("Courier", size=10)

    # Info General
    pdf.cell(0, 10, f"ID SOLICITUD: {order_data['_id']}", 0, 1)
    pdf.cell(0, 10, f"FECHA: {order_data['created_at'].strftime('%Y-%m-%d %H:%M:%S')}", 0, 1)
    pdf.cell(0, 10, f"ID USUARIO: {order_data['user_id']}", 0, 1)
    pdf.ln(10)

    # Tabla de Items
    pdf.set_font("Courier", 'B', 10)
    pdf.cell(80, 10, "TITULO", 1)
    pdf.cell(60, 10, "SEDE RETIRO", 1)
    pdf.cell(40, 10, "PRECIO", 1)
    pdf.ln()

    pdf.set_font("Courier", size=10)
    for item in order_data['items']:
        pdf.cell(80, 10, item['title'][:35], 1)
        pdf.cell(60, 10, item['pickup_location'], 1)
        pdf.cell(40, 10, f"${item['price']:,.0f}", 1)
        pdf.ln()

    pdf.ln(5)
    pdf.set_font("Courier", 'B', 12)
    pdf.cell(0, 10, f"TOTAL: ${order_data['total_amount']:,.0f}", 0, 1, 'R')

    pdf.ln(20)
    pdf.set_font("Courier", 'I', 8)
    pdf.multi_cell(0, 5, "IMPORTANTE: Presente este comprobante en la sede correspondiente para el retiro de sus ejemplares. Esta reserva tiene una validez de 48 horas habiles.")

    pdf.output(os.path.join(RECEIPTS_DIR, filename))

@router.post("/", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_in: OrderCreate,
    background_tasks: BackgroundTasks,
    profile=Depends(get_current_profile),
):
    try:
        if order_in.user_id and order_in.user_id != str(profile.id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="user_id no coincide con la sesión")

        if not order_in.items:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="items no puede estar vacío")

        for item in order_in.items:
            if item.price < 0:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="price inválido")

        computed_total = sum(item.price for item in order_in.items)

        order_dict = order_in.model_dump()
        order_dict["_id"] = str(ObjectId())
        order_dict["user_id"] = str(profile.id)
        order_dict["total_amount"] = computed_total
        order_dict["created_at"] = datetime.utcnow()
        order_dict["status"] = "confirmed"
        
        # Generar nombre de archivo PDF
        filename = f"comprobante_{order_dict['_id']}.pdf"
        order_dict["receipt_url"] = f"/static/receipts/{filename}"
        
        # Guardar en Mongo
        await mongo_db.orders.insert_one(order_dict)
        
        # Generar PDF en segundo plano
        background_tasks.add_task(generate_receipt_pdf, order_dict, filename)
        
        return order_dict
    except PyMongoError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating order: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"General error: {str(e)}"
        )

@router.get("/me", response_model=List[OrderOut])
async def get_my_orders(profile=Depends(get_current_profile)):
    try:
        cursor = mongo_db.orders.find({"user_id": str(profile.id)}).sort("created_at", -1)
        orders = await cursor.to_list(length=50)
        return orders
    except PyMongoError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.get("/{user_id}", response_model=List[OrderOut])
async def get_user_orders(user_id: str, profile=Depends(get_current_profile)):
    try:
        if profile.role != "admin" and user_id != str(profile.id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")

        cursor = mongo_db.orders.find({"user_id": user_id}).sort("created_at", -1)
        orders = await cursor.to_list(length=50)
        return orders
    except PyMongoError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
