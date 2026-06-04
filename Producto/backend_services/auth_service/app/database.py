import os  # 'import' equivale al 'import' de Java. Trae la librería nativa para interactuar con el Sistema Operativo.
from pathlib import Path
from dotenv import load_dotenv  # Desde la librería dotenv, importamos solo la función 'load_dotenv'.
from supabase import create_client, Client  # Importamos las clases necesarias para tipar e instanciar el cliente.

load_dotenv(dotenv_path=Path(__file__).resolve().parents[2] / ".env")

# 'os.getenv' lee la variable de entorno del sistema. 
# Esto es exactamente el equivalente a usar la anotación @Value("${supabase.url}") en Spring Boot.
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Validación preventiva: si falta alguna credencial, lanzamos un error inmediatamente para detener el servidor.
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Error: Faltan las credenciales de Supabase en el archivo .env")

# Instanciamos el cliente de Supabase pasándole la URL y la llave.
# En Java/Spring, este objeto 'supabase' sería un @Bean gestionado por el contenedor de Inversión de Control (IoC),
# el cual inyectarías usando @Autowired en tus capas de servicio. En Python lo usamos como un módulo global limpio.
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
