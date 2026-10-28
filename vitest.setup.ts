// Los tests no dependen de la configuración local ni de una base real: se inyecta
// una cadena válida para que la validación de entorno pase sin abrir conexión.
process.env.MONGODB_URI ??= 'mongodb://127.0.0.1:27017/turipat-test';
