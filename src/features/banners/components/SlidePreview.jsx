/**
 * SlidePreview — renders a live preview of a banner slide from form state.
 * Matches the ECOM visual output. Preset determines the layout.
 */
export default function SlidePreview({ slide }) {
  const {
    preset = 'striped_overlay',
    heading = 'Your Heading Here',
    subheading = 'Your subheading goes here',
    button_label = 'Shop Now',
    bg_color = '#1e2d3d',
    stripe_color = '#2563eb',
    text_color = '#ffffff',
    button_color = '#2563eb',
    text_position = 'center',
    animate_stripes = true,
    slider_url = null,
    overlay_image_urls = [],
    // local previews from file inputs
    slider_preview = null,
    overlay_previews = [],
  } = slide;

  const bgImage = slider_preview || slider_url;
  const overlays = overlay_previews.length ? overlay_previews : overlay_image_urls;

  const alignMap = { left: 'flex-start', center: 'center', right: 'flex-end' };
  const textAlign = { left: 'left', center: 'center', right: 'right' };

  const containerStyle = {
    width: '100%',
    height: 280,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 8,
    background: bg_color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: alignMap[text_position] ?? 'center',
  };

  return (
    <div style={containerStyle}>
      {/* Background image */}
      {bgImage && preset !== 'split_text' && (
        <img
          src={bgImage}
          alt=""
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', opacity: preset === 'full_image' ? 1 : 0.35,
          }}
        />
      )}

      {/* Stripes — striped_overlay preset */}
      {preset === 'striped_overlay' && (
        <>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 32,
            background: stripe_color, opacity: 0.85,
            animation: animate_stripes ? 'slideInLeft 0.8s ease' : 'none',
          }} />
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: 32,
            background: stripe_color, opacity: 0.85,
            animation: animate_stripes ? 'slideInRight 0.8s ease' : 'none',
          }} />
        </>
      )}

      {/* Split layout — left text, right image */}
      {preset === 'split_text' && bgImage && (
        <img
          src={bgImage}
          alt=""
          style={{
            position: 'absolute', right: 0, top: 0, bottom: 0,
            width: '50%', height: '100%', objectFit: 'cover',
          }}
        />
      )}

      {/* Overlay floating images — striped_overlay */}
      {preset === 'striped_overlay' && overlays.map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          style={{
            position: 'absolute',
            width: 80, height: 80,
            objectFit: 'contain',
            top: `${15 + i * 25}%`,
            left: `${5 + i * 8}%`,
            opacity: 0.9,
            animation: animate_stripes ? `floatUp 1.${i}s ease-out` : 'none',
          }}
        />
      ))}

      {/* Text content */}
      <div style={{
        position: 'relative', zIndex: 2,
        padding: '0 48px',
        textAlign: textAlign[text_position] ?? 'center',
        maxWidth: preset === 'split_text' ? '50%' : '70%',
        ...(preset === 'split_text' && text_position !== 'right'
          ? { position: 'absolute', left: '5%' }
          : {}),
      }}>
        {heading && (
          <h2 style={{
            color: text_color, fontWeight: 700, margin: '0 0 8px',
            fontSize: 'clamp(1rem, 2.5vw, 1.6rem)', lineHeight: 1.2,
          }}>
            {heading}
          </h2>
        )}
        {subheading && (
          <p style={{
            color: text_color, opacity: 0.85, margin: '0 0 16px',
            fontSize: 'clamp(0.75rem, 1.5vw, 0.95rem)',
          }}>
            {subheading}
          </p>
        )}
        {button_label && (
          <span style={{
            display: 'inline-block',
            padding: '8px 20px',
            background: button_color,
            color: '#fff',
            borderRadius: 4,
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'default',
          }}>
            {button_label}
          </span>
        )}
      </div>

      {/* Preset label badge */}
      <span style={{
        position: 'absolute', top: 8, right: 8,
        background: 'rgba(0,0,0,0.45)', color: '#fff',
        fontSize: '0.65rem', padding: '2px 7px', borderRadius: 3,
      }}>
        {preset}
      </span>

      <style>{`
        @keyframes slideInLeft  { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes slideInRight { from { transform: translateX(100%);  } to { transform: translateX(0); } }
        @keyframes floatUp      { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 0.9; } }
      `}</style>
    </div>
  );
}
