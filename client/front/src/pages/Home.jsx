import { motion } from "framer-motion";
import Nav from "../components/Layout/Nav";
import Container from "../components/Layout/Container";
import { Link } from "react-router-dom";

export default function Home(){
  return (
    <>
      <Nav />
      <section className="relative overflow-hidden">
        <img
          src="/Image/Hero/hero1.jpg"
          alt="Crop field background"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="relative z-10">
          <Container>
            <div className="py-20 text-center">
              <motion.h1
                initial={{opacity:0, y:12}}
                animate={{opacity:1, y:0}}
                className="text-5xl font-extrabold leading-tight"
              >
                Smarter Crop Health Detection 🌿
              </motion.h1>
              <p className="mt-4 text-gray-700 text-lg max-w-2xl mx-auto">
                Instantly analyze leaf health, detect diseases, and receive actionable
                insights using AI — all on one platform.
              </p>
              <div className="mt-8 flex justify-center gap-4">
                <Link to="/signup" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg">
                  Get Started
                </Link>
                <Link to="/health" className="border border-gray-900 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-100">
                  Try Health Check
                </Link>
              </div>
            </div>
          </Container>
        </div>
      </section>

      {/* Features section */}
      <Container>
        <div className="py-16 grid md:grid-cols-3 gap-6">
          {[
            { img: "/Image/Features/feature1.png", title: "AI Disease Detection", text: "Identify crop diseases instantly using deep learning." },
            { img: "/Image/Features/feature2.png", title: "Explainable Visualization", text: "See exactly which leaf areas the model focused on." },
            { img: "/Image/Features/feature3.png", title: "Actionable Insights", text: "Get treatment and prevention recommendations tailored to your crop." },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: i*0.1}}
              className="rounded-2xl border bg-white shadow-sm overflow-hidden"
            >
              <img src={f.img} alt={f.title} className="h-40 w-full object-cover" />
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600">{f.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </>
  );
}
