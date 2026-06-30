export interface XtreamCredentials {
  server: string;
  username: string;
  password: string;
}

export async function testConnection(
  credentials: XtreamCredentials
): Promise<boolean> {
  console.log("Probando conexión con:", credentials.server);

  // Aquí implementaremos la conexión real más adelante.
  return true;
}