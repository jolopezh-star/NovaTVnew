export interface XtreamCredentials {
  server: string;
  username: string;
  password: string;
}
export interface ConnectionResult {
  success: boolean;
  message: string;
}
export async function testConnection(
  credentials: XtreamCredentials
): Promise<ConnectionResult> {
  console.log("Probando conexión con:", credentials.server);

  // Aquí implementaremos la conexión real más adelante.
 return {
  success: true,
  message: "Conexión simulada correcta",
};
}