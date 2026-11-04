/** Colour legend under every stage: colour is never the only signal (boxes also carry stereotype labels). */
export default function Legend({ compact = false }: { compact?: boolean }) {
  return (
    <div className="legend" aria-label="Diagram legend">
      <span><i className="sw sw-iface" />Interface</span>
      {!compact && <span><i className="sw sw-abstract" />Abstract class</span>}
      <span><i className="sw sw-concrete" />Concrete class</span>
      <span><i className="sw sw-client" />Client</span>
      <span><i className="sw sw-key" />Key pattern role</span>
      <span><i className="sw sw-call" />Call</span>
      <span><i className="sw sw-result" />Return value</span>
    </div>
  );
}
