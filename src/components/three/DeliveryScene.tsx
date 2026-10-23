const routeStops = [
  { label: "Kho Sơn Khang", className: "auth-stop auth-stop-origin" },
  { label: "Điểm giao 01", className: "auth-stop auth-stop-one" },
  { label: "Điểm giao 02", className: "auth-stop auth-stop-two" },
];

export default function DeliveryScene() {
  return (
    <div className="auth-scene" aria-hidden="true">
      <div className="auth-scene-glow" />
      <div className="auth-scene-grid" />

      <div className="auth-scene-copy">
        <span className="auth-eyebrow auth-eyebrow-light">Vận hành trên một nhịp</span>
        <h2>Từ kho đến khách hàng,<br />mọi dữ liệu đều liền mạch.</h2>
        <p>Điều phối giao hàng, đối soát COD và kiểm soát tồn kho theo thời gian thực.</p>
      </div>

      <div className="auth-route-map">
        <div className="auth-route-line" />
        {routeStops.map((stop) => (
          <div className={stop.className} key={stop.label}>
            <span className="auth-stop-dot" />
            <span className="auth-stop-label">{stop.label}</span>
          </div>
        ))}

        <div className="auth-truck auth-vehicle">
          <div className="auth-truck-cargo"><span>SK</span></div>
          <div className="auth-truck-cabin" />
          <div className="auth-wheel auth-wheel-one" />
          <div className="auth-wheel auth-wheel-two" />
        </div>

        <div className="auth-motorbike auth-vehicle">
          <div className="auth-bike-box">SK</div>
          <div className="auth-bike-body" />
          <div className="auth-bike-wheel auth-bike-wheel-one" />
          <div className="auth-bike-wheel auth-bike-wheel-two" />
        </div>
      </div>

      <div className="auth-scene-metric">
        <span className="auth-live-dot" />
        <div><strong>Đang kết nối</strong><small>Kho · Kế toán · Giao hàng</small></div>
      </div>
    </div>
  );
}
