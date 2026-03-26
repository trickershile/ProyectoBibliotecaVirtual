from fastapi import FastAPI

app = FastAPI(title="Biblioteca Virtual API")

@app.get("/")
async def root():
    return {"message": "Bienvenido a la API de la Biblioteca Virtual"}

@app.get("/test")
async def test_route():
    return {
        "status": "success",
        "message": "La API está funcionando correctamente",
        "version": "1.0.0"
    }
