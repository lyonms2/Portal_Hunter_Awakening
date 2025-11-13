"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BackgroundEffects from "@/components/BackgroundEffects";

export default function CadastroPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmaSenha, setConfirmaSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState({ texto: "", tipo: "" });

  const handleCadastro = async () => {
    setMensagem({ texto: "", tipo: "" });
    setLoading(true);

    try {
      const response = await fetch("/api/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha, confirmaSenha }),
      });

      const data = await response.json();

      if (response.ok) {
        setMensagem({ texto: data.message, tipo: "success" });
        // Limpar formulário
        setEmail("");
        setSenha("");
        setConfirmaSenha("");
        // Redirecionar após 3 segundos
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setMensagem({ texto: data.message, tipo: "error" });
      }
    } catch (error) {
      setMensagem({ 
        texto: "Erro de conexão. Verifique sua internet e tente novamente.", 
        tipo: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-gray-100 relative overflow-hidden">
      <BackgroundEffects />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Botão Voltar */}
        <button
          onClick={() => router.push("/login")}
          className="absolute top-8 left-8 text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-2 font-mono text-sm group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> 
          <span>VOLTAR</span>
        </button>

        {/* Container do formulário */}
        <div className="w-full max-w-lg">
          {/* Cabeçalho */}
          <div className="text-center mb-10">
            <div className="inline-block relative mb-4">
              <h2 className="text-5xl font-black tracking-tight bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent">
                NOVO HUNTER
              </h2>
              <div className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
            </div>
            <p className="text-slate-400 font-mono text-sm mt-6">Registre-se para começar sua jornada</p>
          </div>

          {/* Mensagem de feedback */}
          {mensagem.texto && (
            <div className={`mb-6 p-4 rounded-lg border ${
              mensagem.tipo === 'success' 
                ? 'bg-green-950/50 border-green-500/30 text-green-400' 
                : 'bg-red-950/50 border-red-500/30 text-red-400'
            }`}>
              <p className="text-sm font-mono">{mensagem.texto}</p>
            </div>
          )}

          {/* Formulário */}
          <div className="relative group mb-6">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
            
            <div className="relative bg-slate-950/90 backdrop-blur-xl border border-cyan-900/30 rounded-lg p-8 shadow-2xl">
              {/* Email */}
              <div className="mb-6">
                <label className="block text-cyan-400 text-xs uppercase tracking-widest mb-3 font-mono">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="hunter@zone-7.net"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3.5 bg-slate-900/80 border border-slate-700/50 rounded text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all font-mono disabled:opacity-50"
                />
              </div>

              {/* Senha */}
              <div className="mb-6">
                <label className="block text-cyan-400 text-xs uppercase tracking-widest mb-3 font-mono">
                  Senha (mínimo 6 caracteres)
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3.5 bg-slate-900/80 border border-slate-700/50 rounded text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all font-mono disabled:opacity-50"
                />
              </div>

              {/* Confirmar Senha */}
              <div className="mb-8">
                <label className="block text-cyan-400 text-xs uppercase tracking-widest mb-3 font-mono">
                  Confirmar Senha
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={confirmaSenha}
                  onChange={(e) => setConfirmaSenha(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3.5 bg-slate-900/80 border border-slate-700/50 rounded text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all font-mono disabled:opacity-50"
                />
              </div>

              {/* Botão de Cadastro */}
              <button
                onClick={handleCadastro}
                disabled={loading}
                className="w-full group/btn relative mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded blur opacity-40 group-hover/btn:opacity-75 transition-all duration-300"></div>
                
                <div className="relative px-6 py-4 bg-slate-950 rounded border border-cyan-500/50 group-hover/btn:border-cyan-400 transition-all">
                  <span className="text-lg font-bold tracking-wider uppercase bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                    {loading ? "Registrando..." : "Criar Conta"}
                  </span>
                </div>
              </button>

              {/* Link para login */}
              <div className="text-center">
                <button 
                  onClick={() => router.push("/login")}
                  className="text-xs font-mono text-slate-500 hover:text-cyan-400 transition-colors"
                >
                  Já tem uma conta? Fazer login
                </button>
              </div>
            </div>
          </div>

          {/* Aviso */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-blue-500/10 rounded blur"></div>
            <div className="relative bg-slate-950/50 backdrop-blur border border-blue-900/20 rounded p-4">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-blue-400/80 font-mono leading-relaxed">
                    INFO: Após o registro, você receberá um email de confirmação. 
                    Verifique sua caixa de entrada e spam.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      </div>
  );
}
