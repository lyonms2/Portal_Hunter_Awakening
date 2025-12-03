"use client";

/**
 * Toast de confirmação de ações
 */
export default function ToastConfirmacao({ tipo, mensagem }) {
  if (!tipo || !mensagem) return null;

  return (
    <div className="fixed top-8 right-8 z-50 animate-fade-in">
      <div className={`px-6 py-4 rounded-lg border-2 ${
        tipo === 'sucesso'
          ? 'bg-green-900/90 border-green-500'
          : 'bg-red-900/90 border-red-500'
      } backdrop-blur-xl`}>
        <p className={`font-semibold ${
          tipo === 'sucesso' ? 'text-green-200' : 'text-red-200'
        }`}>
          {mensagem}
        </p>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
