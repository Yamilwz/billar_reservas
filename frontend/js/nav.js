function renderAdminNav(activePage) {
  const pages = [
    { href: '/admin_reservations.html', icon: 'bi-calendar-check', label: 'Reservas' },
    { href: '/admin_inventory.html',    icon: 'bi-box-seam',       label: 'Inventario' },
    { href: '/admin_pos.html',          icon: 'bi-cart3',          label: 'POS / Tienda' },
    { href: '/admin_finances.html',     icon: 'bi-bar-chart-line', label: 'Finanzas' },
  ];
  const user = JSON.parse(localStorage.getItem('user'));
  return `
  <nav class="navbar navbar-expand-lg">
    <div class="container-fluid px-4">
      <a class="navbar-brand" href="/admin_reservations.html"> BILLAR HALL</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#adminNav">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="adminNav">
        <ul class="navbar-nav me-auto gap-1">
          ${pages.map(p => `
            <li class="nav-item">
              <a class="nav-link ${p.href.includes(activePage) ? 'active' : ''}" href="${p.href}">${p.label}</a>
            </li>
          `).join('')}
        </ul>
        <ul class="navbar-nav gap-1">
          <li class="nav-item">
            <a class="nav-link" href="#" style="color:var(--primary)!important">${user ? user.name : 'Admin'}</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="javascript:void(0)" onclick="logout()">Salir</a>
          </li>
        </ul>
      </div>
    </div>
  </nav>`;
}
