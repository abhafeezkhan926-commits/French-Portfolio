/** Static text wrapper retained so existing component imports stay simple. */
export default function GlitchText({ children, className = '' }) {
  const classes = `glitch-hover ${className}`.trim();
  return <span className={classes}>{children}</span>;
}
