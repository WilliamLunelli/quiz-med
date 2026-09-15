import type { Game } from '../api/types';

interface Props {
  game: Game;
  onStart: () => void;
}

/** Capa — primeira tela ao escanear o QR (fundo na cor do jogo). */
export function CoverScreen({ game, onStart }: Props) {
  return (
    <div className="screen screen--navy">
      <div className="screen-inner screen-inner--hero">
        <div className="cover-grid">
          <div className="cover-copy">
            <img
              className="cover-logo"
              src="/logo-slm-branco.png"
              alt="Faculdade São Leopoldo Mandic"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div
              style={{
                marginTop: 26,
                font: '400 12px/1 var(--font)',
                letterSpacing: '.16em',
                textTransform: 'uppercase',
                color: 'var(--yellow)',
              }}
            >
              {game.subjectTitle}
            </div>
            <h1
              style={{
                margin: '20px 0 0',
                font: '600 clamp(34px, 6vw, 48px)/1.06 var(--font)',
                letterSpacing: '-.02em',
                textWrap: 'pretty',
              }}
            >
              {game.title}
            </h1>
            {game.groupName && (
              <div style={{ marginTop: 14, font: 'italic 400 15px/1.45 var(--font)', color: 'rgba(255,255,255,.72)' }}>
                {game.groupName}
              </div>
            )}
          </div>

          <div className="cover-media">
            {game.coverPhotoUrl ? (
              <img
                src={game.coverPhotoUrl}
                alt={`Foto do grupo ${game.groupName || ''}`.trim()}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: 'radial-gradient(circle,rgba(255,255,255,.5) 30%,transparent 32%)',
                    backgroundSize: '5px 5px',
                    opacity: 0.55,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'grid',
                    placeItems: 'center',
                    font: '400 12.5px/1.4 var(--font)',
                    color: 'rgba(255,255,255,.75)',
                    textAlign: 'center',
                  }}
                >
                  foto do grupo
                </div>
              </>
            )}
          </div>

          <div className="cover-cta">
            <div style={{ font: '400 14px/1.45 var(--font)', color: 'rgba(255,255,255,.7)' }}>
              10 afirmações. Verdadeiro ou falso.
              <br />
              No seu ritmo — ninguém está te esperando.
            </div>
            <button
              className="qbtn qbtn--white"
              style={{ height: 64, font: '600 19px/1 var(--font)' }}
              onClick={onStart}
            >
              Começar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
