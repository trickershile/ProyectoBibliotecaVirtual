import sys
import os

# Añadir el path para importar desde app
sys.path.append(os.path.join(os.getcwd(), "backend-api"))

try:
    from app.core.security import get_password_hash
except ImportError:
    print("[ERROR]: No se pudo encontrar el módulo de seguridad. Asegúrate de estar en la carpeta raíz del proyecto.")
    sys.exit(1)

def main():
    if len(sys.argv) < 2:
        print("\nUSO: python generar_hash.py TU_CONTRASEÑA")
        print("Ejemplo: python generar_hash.py password123\n")
        return

    password = sys.argv[1]
    hashed = get_password_hash(password)
    
    print("\n" + "="*50)
    print(f"CONTRASEÑA ORIGINAL: {password}")
    print(f"HASH GENERADO: {hashed}")
    print("="*50)
    print("\nCopia el HASH GENERADO y pégalo en el campo 'hashed_password' de tu base de datos.\n")

if __name__ == "__main__":
    main()
