from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base

class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    author = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    is_new = Column(Boolean, default=True) # True = Nuevo, False = Usado
    status = Column(String, default="available") # available (Disponible ahora), loaned (En préstamo), sold, donated
    location = Column(String, default="Plaza de Maipú")
    price = Column(Float, nullable=True)
    
    # Filtros de Disponibilidad y Entrega
    delivery_type = Column(String, default="Retiro en biblioteca") # Retiro en biblioteca, Coordinar con vecino
    
    # Filtros de Origen y Propiedad
    owner_type = Column(String, default="Municipalidad de Maipú") # Municipalidad de Maipú, Colección Privada
    pickup_location = Column(String, default="Plaza de Maipú") # Plaza de Maipú, Ciudad Satélite, El Abrazo, Hospital El Carmen, etc.
    
    # Filtros de Contenido (Metadatos)
    category = Column(String, index=True) # Literatura Infantil, Textos Escolares, Novelas, Ensayos, Ciencia Ficción
    language = Column(String, default="Español") # Español, Inglés, Otros
    educational_level = Column(String, default="General") # Básica, Media, Universitario, General
    
    # Filtros de Estado Físico
    physical_condition = Column(String, default="Nuevo") # Nuevo, Excelente estado, Con marcas de uso
    
    # Nuevos campos solicitados
    publication_date = Column(DateTime, default=datetime.utcnow)
    sales_count = Column(Integer, default=0)
    rating = Column(Float, default=0.0)
    
    # Relación con el vendedor
    seller_id = Column(Integer, ForeignKey("users.id"))
    seller = relationship("User", backref="books")
