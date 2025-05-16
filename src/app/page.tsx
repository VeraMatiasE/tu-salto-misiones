import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen w-screen  flex justify-center items-center flex-col gap-5">
      <h2 className="text-3xl font-extrabold">Tu Salto Misiones</h2>
      <Link
        className="p-2 bg-blue-800 h-10 pointer hover:bg-blue-700 transition-all rounded-sm flex items-center justify-center text-white font-bold"
        style={{ width: "200px" }}
        href={"/log-in"}
      >
        Iniciar sesión
      </Link>
      <Link
        className="p-2 border border-blue-900 h-10 pointer hover:border-blue-700 transition-all rounded-sm flex items-center justify-center text-blue-800 font-bold"
        style={{ width: "200px" }}
        href={"/sign-up"}
      >
        Registrarse
      </Link>
    </div>
  );
}