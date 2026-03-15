import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}

const FAQItem = ({ question, answer, isOpen, onClick }: FAQItemProps) => {
  return (
    <div className="border-b border-zinc-200/10 last:border-0">
      <button
        onClick={onClick}
        className="w-full py-6 flex items-center justify-between text-left group transition-all"
      >
        <span className={`text-lg md:text-xl font-semibold tracking-tight transition-colors ${isOpen ? 'text-white' : 'text-zinc-500 group-hover:text-white'}`}>
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className={`shrink-0 ml-4 ${isOpen ? 'text-indigo-500' : 'text-zinc-600'}`}
        >
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-8 text-zinc-400 leading-relaxed text-base md:text-lg max-w-3xl">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const FAQAccordion = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "O acesso é realmente ilimitado ou existe um limite escondido?",
      answer: "Diferente de outras ferramentas que cobram por cada clique, o ArchRender AI acredita na liberdade criativa. No Plano Fundador, você tem acesso ilimitado. Crie 10 ou 1.000 renders no mês: o valor de R$ 24,00 é fixo e sem surpresas."
    },
    {
      question: "Eu não entendo nada de IA. Vou conseguir usar?",
      answer: "Sim. Somos o único SaaS que entrega vídeo-tutoriais curtos para cada tipo de comando. Se você sabe copiar e colar, você sabe usar o ArchRender. É como ter um especialista em IA sentado ao seu lado guiando cada clique."
    },
    {
      question: "Por que o preço de R$ 24 está tão barato?",
      answer: "Este é o Plano de Membro Fundador. Estamos construindo a maior comunidade de arquitetos high-tech do Brasil. Quem entrar agora garante esse valor promocional para sempre; as próximas vagas terão o valor reajustado conforme o crescimento da plataforma."
    },
    {
      question: "Posso usar no tablet ou celular durante uma reunião com cliente?",
      answer: "Com certeza. O ArchRender AI é 100% responsivo. Você pode subir a foto de um rascunho direto do seu iPad ou smartphone e gerar o prompt de elite ali mesmo, na frente do cliente, transformando a reunião em uma experiência de venda."
    },
    {
      question: "As imagens geradas têm qualidade profissional para apresentações?",
      answer: "Sim. Nossos prompts são configurados para Ultra-Realismo (8K, Photorealistic, RAW). Eles são desenhados para gerar imagens com qualidade de portfólio, prontas para redes sociais de luxo e apresentações finais."
    },
    {
      question: "Como funciona a atualização da biblioteca?",
      answer: "Nossa biblioteca é viva. Toda semana adicionamos novos estilos, materiais e configurações baseadas nas tendências globais do mercado. Como Membro Fundador, você recebe todas as atualizações sem custo adicional."
    },
    {
      question: "E se eu quiser cancelar?",
      answer: "Sem letras miúdas. Se você sentir que não precisa mais da ferramenta, pode cancelar sua assinatura com um clique dentro do seu dashboard. Sem multas, sem burocracia e sem fidelidade."
    },
    {
      question: "E se eu não gostar do resultado? Consigo ajustar o prompt?",
      answer: "Diferente de ferramentas automatizadas, nós te damos o controle. Nossos vídeos ensinam você a fazer o \"Fine-Tuning\" (ajuste fino), mudando palavras-chave para alterar apenas a luz ou materiais, sem perder a essência do projeto."
    }
  ];

  return (
    <section id="faq" className="py-24 px-6 bg-zinc-950 relative overflow-hidden">
      {/* Background radial gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-indigo-500/[0.02] blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1 mb-6 bg-indigo-500/10 text-indigo-500 rounded-full text-[10px] md:text-xs font-semibold uppercase tracking-tight"
          >
            Dúvidas Frequentes
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-semibold tracking-tighter text-white mb-6"
          >
            Perguntas de Ouro
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-zinc-500 text-base md:text-lg"
          >
            Tudo o que você precisa saber para entrar no Plano Fundador com segurança.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="backdrop-blur-md bg-white/[0.02] border border-white/5 rounded-[32px] p-4 md:p-8 shadow-2xl"
        >
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
};
