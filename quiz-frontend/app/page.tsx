import Link from "next/link"

export default function HomePage() {
  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h1>Квест-платформа</h1>
      <p>Участвуйте в квестах и выигрывайте призы!</p>
      
      <div style={{ marginTop: 30, display: "flex", justifyContent: "center", gap: 20 }}>
        <Link 
          href="/quests"
          style={{
            padding: "12px 24px",
            background: "#0070f3",
            color: "white",
            textDecoration: "none",
            borderRadius: 6,
            display: "inline-block"
          }}
        >
          Смотреть все квесты
        </Link>
        <Link 
          href="/admin"
          style={{
            padding: "12px 24px",
            background: "#666",
            color: "white",
            textDecoration: "none",
            borderRadius: 6,
            display: "inline-block"
          }}
        >
          Админ-панель
        </Link>
      </div>
    </div>
  )
}