import Link from 'next/link';

export default function Landing() {
  return (
    <main style={styles.main}>
      <header style={styles.header}>

<Link href="/" style={{ display: 'block', textAlign: 'center', marginBottom: 16 }}>
  <img
    src="/welcome-logo.png"
    alt="Welcome"
    style={{
      maxWidth: 320,
      width: '60%',
      height: 'auto',
      cursor: 'pointer',
      display: 'inline-block',
    }}
  />
</Link>

        <h1 style={styles.headline}>WHAT&apos;S NEXT?</h1>
        <p style={styles.subtitle}>
          See where God is leading you in your Discipleship Journey
        </p>
      </header>

      <section style={styles.tiles}>
        {/* Tile 1 — Discipleship Journey */}
        <Link href="/journey/" style={styles.tileLink}>
          <div style={styles.tile}>
            <div style={styles.icon}>🧭</div>
            <h2 style={styles.tileTitle}>
              Discipleship<br />Journey<br />Calendar
            </h2>
            <ul style={styles.stageList}>
              <li><span style={{ ...styles.dot, background: '#F5C518' }} /> Engage</li>
              <li><span style={{ ...styles.dot, background: '#8BC34A' }} /> Edify</li>
              <li><span style={{ ...styles.dot, background: '#2E9DF7' }} /> Equip</li>
              <li><span style={{ ...styles.dot, background: '#8B1A1A' }} /> Empower</li>
            </ul>
            <p style={styles.quote}>&quot;Check activities in the Discipleship Journey&quot;</p>
            <span style={styles.exploreLink}>Explore →</span>
          </div>
        </Link>

        {/* Tile 2 — Organizers' Calendar */}
        <Link href="/division/" style={styles.tileLink}>
          <div style={styles.tile}>
            <div style={styles.icon}>🏛️</div>
            <h2 style={styles.tileTitle}>
              Organizers&apos;<br />Calendar
            </h2>
            <ul style={styles.stageList}>
              <li><span style={{ ...styles.dot, background: '#1FA3C0' }} /> GLC</li>
              <li><span style={{ ...styles.dot, background: '#8BC34A' }} /> Ministries</li>
              <li><span style={{ ...styles.dot, background: '#F5C518' }} /> Pastoral Areas</li>
            </ul>
            <p style={styles.quote}>&quot;What is [X] doing next?&quot;</p>
            <span style={styles.exploreLink}>Explore →</span>
          </div>
        </Link>

        {/* Tile 3 — Monthly Calendars */}
        <Link href="/month/current" style={{ textDecoration: 'none' }}>
          <div style={styles.tile}>
            <div style={styles.icon}>📅</div>
            <h2 style={styles.tileTitle}>
              Monthly<br />Calendars
            </h2>
            <p style={styles.tileBody}>
              January to December
            </p>
            <p style={styles.quote}>&quot;What&apos;s happening this month?&quot;</p>
            <span style={styles.exploreLink}>Explore →</span>
          </div>
        </Link>
      </section>

      <footer style={styles.footer}>
        💡 Not sure where to start? <strong>Ask the Assistant</strong> 💬
      </footer>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: '100vh',
    background: '#C5E4F0',
    padding: '4vh 5vw',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  header: {
    textAlign: 'center',
    marginBottom: '3vh',
    maxWidth: '900px',
  },
  headline: {
    fontSize: 'clamp(2rem, 6vh, 4rem)',
    color: '#1FA3C0',
    fontWeight: 900,
    letterSpacing: '-0.02em',
    lineHeight: 1.05,
    marginBottom: '0.4em',
  },
  subtitle: {
    fontSize: 'clamp(1rem, 2vh, 1.3rem)',
    color: '#2D3748',
    marginBottom: '0.5em',
  },
  tiles: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '1.5rem',
    width: '100%',
    maxWidth: '1200px',
    marginTop: '1rem',
  },
  tileLink: {
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
  },
  tile: {
    background: 'white',
    border: '3px solid #1A202C',
    borderRadius: '16px',
    padding: '1.75rem 1.5rem',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  },
  icon: {
    fontSize: '2.5rem',
    marginBottom: '0.6rem',
  },
  tileTitle: {
    fontSize: 'clamp(1.2rem, 2.4vh, 1.6rem)',
    fontWeight: 800,
    color: '#1FA3C0',
    lineHeight: 1.15,
    marginBottom: '1rem',
  },
  stageList: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 1rem 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  dot: {
    display: 'inline-block',
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    marginRight: '0.6rem',
    verticalAlign: 'middle',
    border: '1px solid rgba(0,0,0,0.15)',
  },
  tileBody: {
    fontSize: '1rem',
    color: '#2D3748',
    marginBottom: '1rem',
    fontWeight: 500,
  },
  quote: {
    fontSize: '0.95rem',
    color: '#4A5568',
    fontStyle: 'italic',
    marginBottom: '1.2rem',
    marginTop: 'auto',
  },
  footer: {
    marginTop: '3vh',
    fontSize: 'clamp(0.95rem, 1.8vh, 1.15rem)',
    color: '#2D3748',
    textAlign: 'center',
  },
};
