import { logIn } from "@/actions/auth";
import Link from "next/link";
import React from "react";

const Login = () => {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-5">
      <form className="w-1/4 flex items-center flex-col gap-5">
        <h3 className="text-3xl font-bold mb-10">Iniciar Sesion</h3>

        <input
          type="email"
          id="email"
          name="email"
          placeholder="Email"
          className="text-m p-3 rounded-md border border-blue-900 tex-blue-900  outline-none focus:border-blue-950 w-full"
        />

        <input
          type="password"
          id="password"
          name="password"
          placeholder="Password"
          className="text-m p-3 rounded-md border border-blue-900 tex-blue-900  outline-none focus:border-blue-950 w-full"
        />
        <button
          formAction={logIn}
          className="p-2 bg-blue-800 h-10 pointer hover:bg-blue-700 transition-all rounded-sm flex items-center justify-center text-white font-bold w-full"
        >
          Iniciar sesion
        </button>
      </form>

      <Link href={"/"} className="font-bold">
        Regresar
      </Link>
    </main>
  );
};

export default Login;