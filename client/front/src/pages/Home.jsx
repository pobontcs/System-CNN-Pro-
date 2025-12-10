import { motion } from "framer-motion";
import Nav from "../components/Layout/Nav";
import Container from "../components/Layout/Container";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <>
      <Nav />

      {/* HERO SECTION */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-gradient-to-br from-green-50 via-white to-green-100">
        
        {/* Abstract floating shapes */}
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-green-300/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 -right-20 w-72 h-72 bg-lime-400/20 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-green-300/10 blur-3xl rounded-full"></div>

        <img
          src="src/assets/AIPRO.jpg"
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-multiply"
        />

        <div className="relative z-10 w-full">
          <Container>
            <div className="py-24 text-center">
            <motion.h1
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7 }}
                  className="
                           text-6xl md:text-7xl font-extrabold tracking-tight
                            bg-[linear-gradient(270deg,#7a1fa2,#1e5ad7,#00c8d2,#1ed88f)]
                               bg-clip-text text-transparent
                                 font-[Orbitron]
                               ">
  CROP VISION AI beta
</motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-4 text-xl text-gray-700 max-w-2xl mx-auto"
              >
                Detect crop diseases, monitor plant health, and receive regional alerts powered by state-of-the-art AI.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-10 flex justify-center gap-4"
              >
                <Link
                  to="/signup"
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-xl shadow-green-300/40 hover:shadow-green-500/50 transition-all"
                >
                  Get Started
                </Link>
                <Link
                  to="/health"
                  className="px-8 py-3 border border-green-700 text-green-700 rounded-xl bg-white/60 backdrop-blur hover:bg-white shadow-lg transition-all"
                >
                  Try Health Check
                </Link>
              </motion.div>
            </div>
          </Container>
        </div>
      </section>

      {/* FEATURES */}
      <Container>
        <div className="py-20 grid md:grid-cols-3 gap-10">
          {[
            {
              img: "src/assets/pepper.jpg",
              title: "AI Disease Detection",
              text: "Identify crop diseases instantly using advanced deep learning.",
            },
            {
              img: "src/assets/tomato.jpg",
              title: "Explainable Heatmaps",
              text: "Visualize which leaf regions the AI focuses on for predictions.",
            },
            {
              img: "src/assets/potato.jpg",
              title: "Actionable Insights",
              text: "Receive treatment suggestions and prevention strategies.",
            },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="group rounded-3xl bg-white/70 backdrop-blur-xl shadow-xl shadow-green-300/30 hover:shadow-2xl hover:shadow-green-400/40 transition-all overflow-hidden"
            >
              <div className="overflow-hidden">
                <img
                  src={f.img}
                  alt={f.title}
                  className="h-48 w-full object-cover group-hover:scale-105 transition-all duration-500"
                />
              </div>
              <div className="p-6">
                <h3 className="font-bold text-xl text-green-800">{f.title}</h3>
                <p className="text-gray-700 mt-2">{f.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </>
  );
}
