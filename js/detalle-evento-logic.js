function openAgendaDay(evt, day) {
  // Selecciona todos los contenedores de las tablas y los oculta
  const eventAgendaTables = document.querySelectorAll(".eventAgendaTable");
  eventAgendaTables.forEach(table => {
    table.style.display = "none";
  });

  // Selecciona todos los botones de las pestañas y les quita la clase "active"
  const tabLinks = document.querySelectorAll(".eventAgendaDatesTabLinks");
  tabLinks.forEach(link => {
    link.classList.remove("active");
  });

  // Muestra la tabla del día correspondiente y le agrega "active" al botón clickeado
  document.getElementById(day).style.display = "block";
  evt.currentTarget.classList.add("active");
}