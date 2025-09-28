import { toast } from "react-hot-toast";

export default function Home() {
  return (
    <main className="max-w-5xl px-4 py-16 mx-auto">
      <section
        className="p-12 text-center text-white shadow-2xl rounded-3xl bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500"
        aria-label="Welcome Banner"
      >
        <h1 className="text-4xl font-extrabold sm:text-5xl drop-shadow-lg">
          Welcome to <span className="underline decoration-white/50">NotifyPro</span>
        </h1>
        <p className="max-w-xl mx-auto mt-4 text-lg font-medium sm:text-xl drop-shadow-md">
          A tiny demo app with signup, login, and a dashboard for managing
          your notification preferences easily and securely.
        </p>

        <div className="flex flex-col justify-center gap-4 mt-8 sm:flex-row">
          <button
            onClick={() => toast.success("Redirecting to signup...")}
            className="px-6 py-3 font-semibold text-indigo-600 transition bg-white rounded-lg shadow hover:bg-gray-100"
          >
            Get Started
          </button>
          <button
            onClick={() => toast("Learn more coming soon...")}
            className="px-6 py-3 font-semibold text-white transition border border-white rounded-lg hover:bg-white hover:text-purple-600"
          >
            Learn More
          </button>
        </div>
      </section>
    </main>
  );
}
