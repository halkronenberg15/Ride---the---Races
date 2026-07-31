import { useEffect, useState } from 'react'

type DirectorReportProps = {
  stageNumber: number
  destination: string
  rideTime: string
  climbingTime: string
  highIntensityTime: string
  segmentCount: number
  onContinue: () => void
}

function DirectorReport({
  stageNumber,
  destination,
  rideTime,
  climbingTime,
  highIntensityTime,
  segmentCount,
  onContinue,
}: DirectorReportProps) {
  const [showReport, setShowReport] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowReport(true)
    }, 1800)

    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div
      className="dashboard-card"
      style={{
        marginTop: '16px',
        padding: '42px 24px',
        textAlign: 'center',
        border: '2px solid rgba(244, 106, 0, 0.8)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          fontSize: '4.8rem',
          animation: 'finishPulse 1.2s ease-in-out infinite alternate',
        }}
      >
        🏁
      </div>

      <p className="eyebrow">STAGE {stageNumber} COMPLETE</p>

      <h2
        style={{
          margin: '8px 0',
          fontSize: 'clamp(2.8rem, 8vw, 5rem)',
        }}
      >
        {destination}
      </h2>

      <p
        style={{
          maxWidth: '620px',
          margin: '12px auto 28px',
          fontSize: '1.2rem',
          lineHeight: 1.6,
        }}
      >
        You are across the line. Keep turning the pedals gently
        while your breathing settles.
      </p>

      <div
        style={{
          height: '2px',
          width: showReport ? '100%' : '0%',
          margin: '0 auto 28px',
          background:
            'linear-gradient(90deg, transparent, #f46a00, transparent)',
          transition: 'width 1.2s ease',
        }}
      />

      <div
        style={{
          opacity: showReport ? 1 : 0,
          transform: showReport
            ? 'translateY(0)'
            : 'translateY(24px)',
          transition:
            'opacity 0.8s ease, transform 0.8s ease',
        }}
      >
        <p className="eyebrow">DIRECTOR’S REPORT</p>

        <blockquote
          style={{
            maxWidth: '680px',
            margin: '16px auto 30px',
            padding: '22px',
            border: 0,
            borderLeft: '4px solid #f46a00',
            borderRadius: '12px',
            textAlign: 'left',
            background: 'rgba(255, 255, 255, 0.05)',
            fontSize: 'clamp(1.1rem, 3vw, 1.35rem)',
            lineHeight: 1.6,
          }}
        >
          “Strong pacing today, Hal. You stayed controlled on the
          approach, committed to both climbs, and still had enough
          left for the final ramp. That is how a general
          classification rider manages a mountain stage.”
        </blockquote>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '12px',
            marginBottom: '26px',
          }}
        >
          <div
            style={{
              padding: '18px 12px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.05)',
            }}
          >
            <small>RIDE TIME</small>

            <strong
              style={{
                display: 'block',
                marginTop: '7px',
                fontSize: '1.7rem',
              }}
            >
              {rideTime}
            </strong>
          </div>

          <div
            style={{
              padding: '18px 12px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.05)',
            }}
          >
            <small>CLIMBING</small>

            <strong
              style={{
                display: 'block',
                marginTop: '7px',
                fontSize: '1.7rem',
              }}
            >
              {climbingTime}
            </strong>
          </div>

          <div
            style={{
              padding: '18px 12px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.05)',
            }}
          >
            <small>HIGH INTENSITY</small>

            <strong
              style={{
                display: 'block',
                marginTop: '7px',
                fontSize: '1.7rem',
              }}
            >
              {highIntensityTime}
            </strong>
          </div>

          <div
            style={{
              padding: '18px 12px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.05)',
            }}
          >
            <small>SEGMENTS</small>

            <strong
              style={{
                display: 'block',
                marginTop: '7px',
                fontSize: '1.7rem',
              }}
            >
              {segmentCount}
            </strong>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gap: '10px',
            maxWidth: '620px',
            margin: '0 auto 28px',
            textAlign: 'left',
          }}
        >
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
            }}
          >
            ✅ Controlled the opening kilometers
          </div>

          <div
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
            }}
          >
            ✅ Completed both major climbing efforts
          </div>

          <div
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
            }}
          >
            ✅ Recovered before the final attack
          </div>

          <div
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
            }}
          >
            ✅ Finished the stage with maximum effort
          </div>
        </div>

        <div
          style={{
            padding: '18px',
            marginBottom: '26px',
            borderRadius: '14px',
            background: 'rgba(244, 106, 0, 0.1)',
            border: '1px solid rgba(244, 106, 0, 0.35)',
          }}
        >
          <small>NEXT FOCUS</small>

          <strong
            style={{
              display: 'block',
              marginTop: '8px',
              fontSize: '1.15rem',
            }}
          >
            Maintain cadence above 80 RPM during sustained climbing
            efforts.
          </strong>
        </div>

        <button type="button" onClick={onContinue}>
          Return to Team Bus
        </button>
      </div>

      <style>
        {`
          @keyframes finishPulse {
            from {
              transform: scale(1);
              filter: drop-shadow(0 0 4px rgba(244, 106, 0, 0.2));
            }

            to {
              transform: scale(1.08);
              filter: drop-shadow(0 0 18px rgba(244, 106, 0, 0.65));
            }
          }
        `}
      </style>
    </div>
  )
}

export default DirectorReport