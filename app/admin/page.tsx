"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Sucursal = {
  id: string;
  nombre: string;
  latitud: number;
  longitud: number;
  radio_metros: number;
  activa: boolean;
};

type Empleado = {
  id: string;
  nombre: string;
  telefono: string | null;
  sucursal_id: string | null;
  activo: boolean;
  rol: string | null;
  pin: string | null;
  created_at: string;
  sucursales_asistencia: { nombre: string } | null;
};

type Asistencia = {
  id: string;
  empleado_id: string | null;
  sucursal_id: string | null;
  tipo: string;
  latitud: number | null;
  longitud: number | null;
  distancia_metros: number | null;
  foto_url: string | null;
  estado: string | null;
  puntualidad: string | null;
  created_at: string;
  empleados_asistencia: { nombre: string } | null;
  sucursales_asistencia: { nombre: string } | null;
};

const thStyle = {
  border: "1px solid #cbd5e1",
  padding: 10,
  background: "#0f172a",
  color: "#ffffff",
  fontWeight: "bold",
};

const tdStyle = {
  border: "1px solid #cbd5e1",
  padding: 8,
  background: "#ffffff",
  color: "#000000",
};

const sectionStyle = {
  border: "1px solid #cbd5e1",
  borderRadius: 16,
  padding: 20,
  marginBottom: 30,
  background: "rgba(255,255,255,0.95)",
  backdropFilter: "blur(8px)",
  color: "#000000",
};

const inputStyle = {
  padding: 12,
  color: "#000000",
  background: "#ffffff",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
};

const inputTableStyle = {
  padding: 8,
  width: "100%",
  color: "#000000",
  background: "#ffffff",
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  boxSizing: "border-box" as const,
};

function Tabla({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "#ffffff",
          color: "#000000",
        }}
      >
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} style={thStyle}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export default function AdminPage() {
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [mensaje, setMensaje] = useState("Cargando...");

  const [clave, setClave] = useState("");
  const [accesoAdmin, setAccesoAdmin] = useState(false);
  const [seccionActiva, setSeccionActiva] = useState("dashboard");

  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoTelefono, setNuevoTelefono] = useState("");
  const [nuevoPin, setNuevoPin] = useState("");
  const [nuevoRol, setNuevoRol] = useState("empleado");
  const [nuevaSucursalId, setNuevaSucursalId] = useState("");

  const [sucursalNombre, setSucursalNombre] = useState("");
  const [sucursalLatitud, setSucursalLatitud] = useState("");
  const [sucursalLongitud, setSucursalLongitud] = useState("");
  const [sucursalRadio, setSucursalRadio] = useState("100");

  const CLAVE_ADMIN = "1234";

  useEffect(() => {
    cargarTodo();
  }, []);

  async function cargarTodo() {
    setMensaje("Cargando...");
    await Promise.all([
      cargarAsistencias(),
      cargarEmpleados(),
      cargarSucursales(),
    ]);
    setMensaje("");
  }

  async function cargarAsistencias() {
    const { data, error } = await supabase
      .from("asistencias")
      .select(`
        id,
        empleado_id,
        sucursal_id,
        tipo,
        latitud,
        longitud,
        distancia_metros,
        foto_url,
        estado,
        puntualidad,
        created_at,
        empleados_asistencia ( nombre ),
        sucursales_asistencia ( nombre )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setMensaje("Error al cargar asistencias");
      return;
    }

    setAsistencias((data || []) as unknown as Asistencia[]);
  }

  async function cargarEmpleados() {
    const { data, error } = await supabase
      .from("empleados_asistencia")
      .select(`
        id,
        nombre,
        telefono,
        sucursal_id,
        activo,
        rol,
        pin,
        created_at,
        sucursales_asistencia ( nombre )
      `)
      .order("nombre", { ascending: true });

    if (error) {
      console.error(error);
      setMensaje("Error al cargar empleados");
      return;
    }

    setEmpleados((data || []) as unknown as Empleado[]);
  }

  async function cargarSucursales() {
    const { data, error } = await supabase
      .from("sucursales_asistencia")
      .select("*")
      .order("nombre", { ascending: true });

    if (error) {
      console.error(error);
      setMensaje("Error al cargar sucursales");
      return;
    }

    setSucursales((data || []) as Sucursal[]);

    const activas = (data || []).filter((s) => s.activa);
    if (!nuevaSucursalId && activas.length > 0) {
      setNuevaSucursalId(activas[0].id);
    }
  }

  function editarEmpleadoLocal(
    empleadoId: string,
    campo: keyof Empleado,
    valor: string | boolean | null
  ) {
    setEmpleados((actuales) =>
      actuales.map((empleado) =>
        empleado.id === empleadoId ? { ...empleado, [campo]: valor } : empleado
      )
    );
  }

  async function agregarEmpleado() {
    const nombreLimpio = nuevoNombre.trim();

    if (!nombreLimpio) {
      alert("Escribe el nombre del empleado.");
      return;
    }

    if (!nuevoPin.trim()) {
      alert("Escribe un PIN para el empleado.");
      return;
    }

    if (!nuevaSucursalId) {
      alert("Selecciona una sucursal.");
      return;
    }

    const { error } = await supabase.from("empleados_asistencia").insert({
      nombre: nombreLimpio,
      telefono: nuevoTelefono.trim() || null,
      pin: nuevoPin.trim(),
      rol: nuevoRol || "empleado",
      sucursal_id: nuevaSucursalId,
      activo: true,
    });

    if (error) {
      console.error(error);
      alert("No se pudo agregar el empleado.");
      return;
    }

    setNuevoNombre("");
    setNuevoTelefono("");
    setNuevoPin("");
    setNuevoRol("empleado");
    await cargarEmpleados();
    alert("Empleado agregado.");
  }

  async function guardarEmpleado(empleado: Empleado) {
    if (!empleado.nombre.trim()) {
      alert("El nombre no puede quedar vacío.");
      return;
    }

    if (!empleado.pin || !empleado.pin.trim()) {
      alert("El PIN no puede quedar vacío.");
      return;
    }

    const { error } = await supabase
      .from("empleados_asistencia")
      .update({
        nombre: empleado.nombre.trim(),
        telefono: empleado.telefono?.trim() || null,
        pin: empleado.pin.trim(),
        rol: empleado.rol || "empleado",
        sucursal_id: empleado.sucursal_id,
        activo: empleado.activo,
      })
      .eq("id", empleado.id);

    if (error) {
      console.error(error);
      alert("No se pudo guardar el empleado.");
      return;
    }

    await cargarEmpleados();
    alert("Cambios guardados.");
  }

  async function agregarSucursal() {
    const nombre = sucursalNombre.trim();
    const latitud = Number(sucursalLatitud);
    const longitud = Number(sucursalLongitud);
    const radio = Number(sucursalRadio);

    if (!nombre) {
      alert("Escribe el nombre de la sucursal.");
      return;
    }

    if (Number.isNaN(latitud) || Number.isNaN(longitud)) {
      alert("Latitud y longitud deben ser números.");
      return;
    }

    if (Number.isNaN(radio) || radio <= 0) {
      alert("El radio debe ser mayor a 0.");
      return;
    }

    const { error } = await supabase.from("sucursales_asistencia").insert({
      nombre,
      latitud,
      longitud,
      radio_metros: radio,
      activa: true,
    });

    if (error) {
      console.error(error);
      alert("No se pudo agregar la sucursal.");
      return;
    }

    setSucursalNombre("");
    setSucursalLatitud("");
    setSucursalLongitud("");
    setSucursalRadio("100");
    await cargarSucursales();
    alert("Sucursal agregada.");
  }

  async function cambiarSucursalActiva(sucursal: Sucursal) {
    const { error } = await supabase
      .from("sucursales_asistencia")
      .update({ activa: !sucursal.activa })
      .eq("id", sucursal.id);

    if (error) {
      console.error(error);
      alert("No se pudo actualizar la sucursal.");
      return;
    }

    await cargarSucursales();
  }

  async function actualizarRadioSucursal(sucursalId: string, radio: string) {
    const radioNumero = Number(radio);

    if (Number.isNaN(radioNumero) || radioNumero <= 0) {
      alert("Radio inválido.");
      return;
    }

    const { error } = await supabase
      .from("sucursales_asistencia")
      .update({ radio_metros: radioNumero })
      .eq("id", sucursalId);

    if (error) {
      console.error(error);
      alert("No se pudo actualizar el radio.");
      return;
    }

    await cargarSucursales();
  }

  function horaTexto(fecha: string) {
    return new Date(fecha).toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function calcularMinutosTrabajados(inicio: string, fin?: string) {
    const entrada = new Date(inicio).getTime();
    const salida = fin ? new Date(fin).getTime() : new Date().getTime();
    const minutos = Math.floor((salida - entrada) / 1000 / 60);
    return minutos > 0 ? minutos : 0;
  }

  function formatoHorasMinutos(minutosTotales: number) {
    const horas = Math.floor(minutosTotales / 60);
    const minutos = minutosTotales % 60;
    return `${horas} h ${minutos} min`;
  }

  const hoy = new Date().toLocaleDateString("es-MX");

  const asistenciasHoy = asistencias.filter(
    (a) => new Date(a.created_at).toLocaleDateString("es-MX") === hoy
  );

  const entradasHoy = asistenciasHoy.filter((a) => a.tipo === "entrada");
  const salidasHoy = asistenciasHoy.filter((a) => a.tipo === "salida");

  const retardosHoy = asistenciasHoy.filter(
    (a) => a.puntualidad === "retardo" || a.puntualidad === "retardo_grave"
  );

  const fueraDeZonaHoy = asistenciasHoy.filter(
    (a) => a.estado === "fuera_de_zona"
  );

  const salidasAnticipadasHoy = asistenciasHoy.filter(
    (a) => a.puntualidad === "salida_anticipada"
  );

  const empleadosPresentes = new Set(
    entradasHoy.map((a) => a.empleado_id).filter(Boolean)
  ).size;

  const resumenHoy = empleados
    .filter((empleado) => empleado.activo)
    .map((empleado) => {
      const registros = asistenciasHoy
        .filter((a) => a.empleado_id === empleado.id)
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
        );

      const entradas = registros.filter((r) => r.tipo === "entrada");
      const salidas = registros.filter((r) => r.tipo === "salida");

      const entrada = entradas[0];
      const salida = salidas[salidas.length - 1];

      let estatus = "No ha llegado";
      let horas = "0 h 0 min";

      if (entrada && !salida) {
        estatus = "Trabajando";
        horas = formatoHorasMinutos(
          calcularMinutosTrabajados(entrada.created_at)
        );
      }

      if (entrada && salida) {
        estatus = "Ya salió";
        horas = formatoHorasMinutos(
          calcularMinutosTrabajados(entrada.created_at, salida.created_at)
        );
      }

      const tieneRetardo = registros.some(
        (r) =>
          r.puntualidad === "retardo" || r.puntualidad === "retardo_grave"
      );

      const salidaAnticipada = registros.some(
        (r) => r.puntualidad === "salida_anticipada"
      );

      const fueraZona = registros.some((r) => r.estado === "fuera_de_zona");

      return {
        empleado: empleado.nombre,
        sucursal: empleado.sucursales_asistencia?.nombre || "Sin sucursal",
        entrada: entrada ? horaTexto(entrada.created_at) : "-",
        salida: salida ? horaTexto(salida.created_at) : "-",
        estatus,
        horas,
        tieneRetardo,
        salidaAnticipada,
        fueraZona,
      };
    });

  const trabajandoAhora = resumenHoy.filter(
    (r) => r.estatus === "Trabajando"
  ).length;

  const noHanLlegado = resumenHoy.filter(
    (r) => r.estatus === "No ha llegado"
  ).length;

  const yaSalieron = resumenHoy.filter(
    (r) => r.estatus === "Ya salió"
  ).length;

  const inicioSemana = new Date();
  const diaSemana = inicioSemana.getDay();
  const diferenciaLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
  inicioSemana.setDate(inicioSemana.getDate() + diferenciaLunes);
  inicioSemana.setHours(0, 0, 0, 0);

  const diasLaboralesSemana = Array.from({ length: 6 }).map((_, index) => {
    const dia = new Date(inicioSemana);
    dia.setDate(inicioSemana.getDate() + index);
    return dia;
  });

  const asistenciasSemana = asistencias.filter(
    (a) => new Date(a.created_at) >= inicioSemana
  );

  const resumenSemanal = empleados.map((empleado) => {
    const registros = asistenciasSemana.filter(
      (a) => a.empleado_id === empleado.id
    );

    const entradas = registros.filter((r) => r.tipo === "entrada");
    const salidas = registros.filter((r) => r.tipo === "salida");

    const retardos = registros.filter(
      (r) => r.puntualidad === "retardo" || r.puntualidad === "retardo_grave"
    );

    const salidasAnticipadas = registros.filter(
      (r) => r.puntualidad === "salida_anticipada"
    );

    const fueraZona = registros.filter((r) => r.estado === "fuera_de_zona");

    const faltas = diasLaboralesSemana.filter((dia) => {
      if (dia > new Date()) return false;

      const fechaDia = dia.toLocaleDateString("es-MX");

      const tuvoEntrada = entradas.some(
        (entrada) =>
          new Date(entrada.created_at).toLocaleDateString("es-MX") === fechaDia
      );

      return !tuvoEntrada;
    }).length;

    return {
      empleado: empleado.nombre,
      sucursal: empleado.sucursales_asistencia?.nombre || "Sin sucursal",
      entradas: entradas.length,
      salidas: salidas.length,
      faltas,
      retardos: retardos.length,
      salidasAnticipadas: salidasAnticipadas.length,
      fueraZona: fueraZona.length,
    };
  });

  const reporteNomina = empleados.map((empleado) => {
    const registros = asistenciasSemana
      .filter((a) => a.empleado_id === empleado.id)
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
      );

    let minutosSemana = 0;

    const entradas = registros.filter((r) => r.tipo === "entrada");
    const salidas = registros.filter((r) => r.tipo === "salida");

    entradas.forEach((entrada) => {
      const salida = salidas.find(
        (s) =>
          new Date(s.created_at).getTime() >
          new Date(entrada.created_at).getTime()
      );

      if (salida) {
        minutosSemana += calcularMinutosTrabajados(
          entrada.created_at,
          salida.created_at
        );
      }
    });

    const retardos = registros.filter(
      (r) => r.puntualidad === "retardo" || r.puntualidad === "retardo_grave"
    ).length;

    const salidasAnticipadas = registros.filter(
      (r) => r.puntualidad === "salida_anticipada"
    ).length;

    const fueraZona = registros.filter((r) => r.estado === "fuera_de_zona")
      .length;

    const faltas = diasLaboralesSemana.filter((dia) => {
      if (dia > new Date()) return false;

      const fechaDia = dia.toLocaleDateString("es-MX");

      const tuvoEntrada = entradas.some(
        (entrada) =>
          new Date(entrada.created_at).toLocaleDateString("es-MX") === fechaDia
      );

      return !tuvoEntrada;
    }).length;

    return {
      empleado: empleado.nombre,
      sucursal: empleado.sucursales_asistencia?.nombre || "Sin sucursal",
      horasTrabajadas: formatoHorasMinutos(minutosSemana),
      faltas,
      retardos,
      salidasAnticipadas,
      fueraZona,
    };
  });

  function descargarExcelNomina() {
    const encabezados = [
      "Empleado",
      "Sucursal",
      "Horas trabajadas",
      "Faltas",
      "Retardos",
      "Salidas anticipadas",
      "Fuera de zona",
    ];

    const filas = reporteNomina.map((r) => [
      r.empleado,
      r.sucursal,
      r.horasTrabajadas,
      r.faltas,
      r.retardos,
      r.salidasAnticipadas,
      r.fueraZona,
    ]);

    const contenido = [encabezados, ...filas]
      .map((fila) => fila.map((celda) => `"${celda}"`).join(","))
      .join("\n");

    const blob = new Blob([contenido], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `nomina-semanal-winmex-${new Date()
      .toLocaleDateString("es-MX")
      .replaceAll("/", "-")}.csv`;

    link.click();
    URL.revokeObjectURL(url);
  }

  function tarjeta(
    titulo: string,
    valor: number,
    descripcion: string,
    color: string
  ) {
    return (
      <div
        style={{
          borderRadius: 18,
          padding: 24,
          color: "#ffffff",
          background: color,
          border: "3px solid rgba(255,255,255,0.25)",
          boxShadow: "0 8px 25px rgba(0,0,0,0.35)",
        }}
      >
        <h3 style={{ margin: 0, fontSize: 18 }}>{titulo}</h3>
        <p style={{ fontSize: 56, fontWeight: "bold", margin: "10px 0" }}>
          {valor}
        </p>
        <small style={{ fontSize: 14 }}>{descripcion}</small>
      </div>
    );
  }

  const sucursalesActivas = sucursales.filter((s) => s.activa);

  if (!accesoAdmin) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0f172a, #991b1b)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <section
          style={{
            width: "100%",
            maxWidth: 420,
            background: "#ffffff",
            borderRadius: 22,
            padding: 28,
            boxShadow: "0 20px 45px rgba(0,0,0,0.35)",
            color: "#0f172a",
          }}
        >
          <h1 style={{ marginTop: 0, fontSize: 30 }}>🔐 Admin Winmex</h1>

          <p style={{ color: "#475569" }}>
            Ingresa la clave para ver el panel administrativo.
          </p>

          <input
            type="password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            placeholder="Clave de administrador"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (clave === CLAVE_ADMIN) {
                  setAccesoAdmin(true);
                } else {
                  alert("Clave incorrecta");
                }
              }
            }}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 12,
              border: "2px solid #cbd5e1",
              fontSize: 17,
              color: "#000",
              background: "#fff",
              marginBottom: 14,
              boxSizing: "border-box",
            }}
          />

          <button
            onClick={() => {
              if (clave === CLAVE_ADMIN) {
                setAccesoAdmin(true);
              } else {
                alert("Clave incorrecta");
              }
            }}
            style={{
              width: "100%",
              padding: 15,
              borderRadius: 12,
              border: "none",
              background: "#dc2626",
              color: "#fff",
              fontSize: 17,
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Entrar
          </button>
        </section>
      </main>
    );
  }

  return (
    <main
      style={{
        padding: 20,
        fontFamily: "Arial, sans-serif",
        backgroundImage: `
          linear-gradient(
            rgba(15,23,42,0.78),
            rgba(15,23,42,0.78)
          ),
          url('/banner-admin.png')
        `,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        minHeight: "100vh",
        color: "#000000",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 46,
              margin: 0,
              color: "#ffffff",
              fontWeight: 900,
              textShadow: "0 4px 20px rgba(0,0,0,0.8)",
            }}
          >
            🏍️ WINMEX CONTROL DE ASISTENCIAS
          </h1>

          <p
            style={{
              color: "#ffffff",
              marginTop: 8,
              fontSize: 18,
              textShadow: "0 2px 10px rgba(0,0,0,0.7)",
            }}
          >
            GPS • Selfie • Horarios • Reportes • Nómina
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={cargarTodo}
            style={{
              padding: "12px 18px",
              borderRadius: 10,
              border: "none",
              background: "#0f172a",
              color: "#ffffff",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Actualizar
          </button>

          <button
            onClick={() => {
              setClave("");
              setAccesoAdmin(false);
            }}
            style={{
              padding: "12px 18px",
              borderRadius: 10,
              border: "none",
              background: "#dc2626",
              color: "#ffffff",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {mensaje && <p style={{ color: "#ffffff" }}>{mensaje}</p>}

      <nav
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 25,
        }}
      >
        {[
          ["dashboard", "📊 Dashboard"],
          ["personal", "👷 Personal"],
          ["nomina", "💰 Nómina"],
          ["empleados", "👤 Empleados"],
          ["sucursales", "🏢 Sucursales"],
          ["registros", "📍 Registros"],
        ].map(([id, texto]) => (
          <button
            key={id}
            onClick={() => setSeccionActiva(id)}
            style={{
              padding: "10px 14px",
              borderRadius: 999,
              border: "none",
              background: seccionActiva === id ? "#dc2626" : "#ffffff",
              color: seccionActiva === id ? "#ffffff" : "#0f172a",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: "0 3px 8px rgba(0,0,0,0.15)",
            }}
          >
            {texto}
          </button>
        ))}
      </nav>

      {seccionActiva === "dashboard" && (
        <>
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
              gap: 18,
              marginBottom: 30,
            }}
          >
            {tarjeta("🟢 PRESENTES", empleadosPresentes, "Personal activo hoy", "#00C853")}
            {tarjeta("🔵 ENTRADAS", entradasHoy.length, "Registros de hoy", "#2962FF")}
            {tarjeta("🟣 SALIDAS", salidasHoy.length, "Registros de hoy", "#AA00FF")}
            {tarjeta("🟠 RETARDOS", retardosHoy.length, "Llegadas tarde", "#FF6D00")}
            {tarjeta("🔴 FUERA DE ZONA", fueraDeZonaHoy.length, "GPS inválido", "#D50000")}
            {tarjeta("⚠️ SALIDA ANTICIPADA", salidasAnticipadasHoy.length, "Antes del horario", "#FF1744")}
          </section>

          <section style={sectionStyle}>
            <h2>📅 Reporte semanal</h2>
            <p>
              Semana desde: <b>{inicioSemana.toLocaleDateString("es-MX")}</b>
            </p>

            <Tabla
              headers={[
                "Empleado",
                "Sucursal",
                "Entradas",
                "Salidas",
                "Faltas",
                "Retardos",
                "Salidas anticipadas",
                "Fuera de zona",
              ]}
            >
              {resumenSemanal.map((r) => (
                <tr key={r.empleado}>
                  <td style={tdStyle}>{r.empleado}</td>
                  <td style={tdStyle}>{r.sucursal}</td>
                  <td style={tdStyle}>{r.entradas}</td>
                  <td style={tdStyle}>{r.salidas}</td>
                  <td style={tdStyle}>{r.faltas}</td>
                  <td style={tdStyle}>{r.retardos}</td>
                  <td style={tdStyle}>{r.salidasAnticipadas}</td>
                  <td style={tdStyle}>{r.fueraZona}</td>
                </tr>
              ))}
            </Tabla>
          </section>
        </>
      )}

      {seccionActiva === "personal" && (
        <section style={sectionStyle}>
          <h2>👷 Estado actual del personal</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 15,
              marginBottom: 20,
            }}
          >
            {tarjeta("🟢 TRABAJANDO", trabajandoAhora, "Empleados activos", "#00C853")}
            {tarjeta("⚫ NO HAN LLEGADO", noHanLlegado, "Sin entrada hoy", "#334155")}
            {tarjeta("🔵 YA SALIERON", yaSalieron, "Con salida registrada", "#2962FF")}
          </div>

          <Tabla
            headers={[
              "Empleado",
              "Sucursal",
              "Entrada",
              "Salida",
              "Horas hoy",
              "Estatus",
              "Incidencias",
            ]}
          >
            {resumenHoy.map((r) => (
              <tr key={r.empleado}>
                <td style={tdStyle}>{r.empleado}</td>
                <td style={tdStyle}>{r.sucursal}</td>
                <td style={tdStyle}>{r.entrada}</td>
                <td style={tdStyle}>{r.salida}</td>
                <td style={tdStyle}>{r.horas}</td>
                <td style={tdStyle}>{r.estatus}</td>
                <td style={tdStyle}>
                  {r.tieneRetardo ? "Retardo " : ""}
                  {r.salidaAnticipada ? "Salida anticipada " : ""}
                  {r.fueraZona ? "Fuera de zona" : ""}
                  {!r.tieneRetardo && !r.salidaAnticipada && !r.fueraZona ? "-" : ""}
                </td>
              </tr>
            ))}
          </Tabla>
        </section>
      )}

      {seccionActiva === "nomina" && (
        <section style={sectionStyle}>
          <h2>💰 Reporte de nómina semanal</h2>

          <button
            onClick={descargarExcelNomina}
            style={{
              padding: "10px 15px",
              marginBottom: 15,
              borderRadius: 8,
              border: "none",
              background: "#00C853",
              color: "#ffffff",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            📥 Descargar Excel
          </button>

          <p>
            Semana desde: <b>{inicioSemana.toLocaleDateString("es-MX")}</b>
          </p>

          <Tabla
            headers={[
              "Empleado",
              "Sucursal",
              "Horas trabajadas",
              "Faltas",
              "Retardos",
              "Salidas anticipadas",
              "Fuera de zona",
            ]}
          >
            {reporteNomina.map((r) => (
              <tr key={r.empleado}>
                <td style={tdStyle}>{r.empleado}</td>
                <td style={tdStyle}>{r.sucursal}</td>
                <td style={tdStyle}>{r.horasTrabajadas}</td>
                <td style={tdStyle}>{r.faltas}</td>
                <td style={tdStyle}>{r.retardos}</td>
                <td style={tdStyle}>{r.salidasAnticipadas}</td>
                <td style={tdStyle}>{r.fueraZona}</td>
              </tr>
            ))}
          </Tabla>
        </section>
      )}

      {seccionActiva === "empleados" && (
        <section style={sectionStyle}>
          <h2>👤 Administración de empleados</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 10,
              marginBottom: 15,
            }}
          >
            <input value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} placeholder="Nombre" style={inputStyle} />
            <input value={nuevoTelefono} onChange={(e) => setNuevoTelefono(e.target.value)} placeholder="Teléfono" style={inputStyle} />
            <input value={nuevoPin} onChange={(e) => setNuevoPin(e.target.value)} placeholder="PIN visible" maxLength={6} style={inputStyle} />

            <select value={nuevoRol} onChange={(e) => setNuevoRol(e.target.value)} style={inputStyle}>
              <option value="empleado">empleado</option>
              <option value="supervisor">supervisor</option>
              <option value="admin">admin</option>
            </select>

            <select value={nuevaSucursalId} onChange={(e) => setNuevaSucursalId(e.target.value)} style={inputStyle}>
              <option value="">Sucursal</option>
              {sucursalesActivas.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>

            <button
              onClick={agregarEmpleado}
              style={{
                padding: 12,
                background: "#00C853",
                color: "#fff",
                border: "none",
                fontWeight: "bold",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Agregar empleado
            </button>
          </div>

          <Tabla headers={["Nombre", "Teléfono", "PIN", "Rol", "Sucursal", "Activo", "Guardar"]}>
            {empleados.map((e) => (
              <tr key={e.id}>
                <td style={tdStyle}>
                  <input value={e.nombre} onChange={(ev) => editarEmpleadoLocal(e.id, "nombre", ev.target.value)} style={inputTableStyle} />
                </td>
                <td style={tdStyle}>
                  <input value={e.telefono || ""} onChange={(ev) => editarEmpleadoLocal(e.id, "telefono", ev.target.value)} style={inputTableStyle} />
                </td>
                <td style={tdStyle}>
                  <input value={e.pin || ""} onChange={(ev) => editarEmpleadoLocal(e.id, "pin", ev.target.value)} style={inputTableStyle} />
                </td>
                <td style={tdStyle}>
                  <select value={e.rol || "empleado"} onChange={(ev) => editarEmpleadoLocal(e.id, "rol", ev.target.value)} style={inputTableStyle}>
                    <option value="empleado">empleado</option>
                    <option value="supervisor">supervisor</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td style={tdStyle}>
                  <select value={e.sucursal_id || ""} onChange={(ev) => editarEmpleadoLocal(e.id, "sucursal_id", ev.target.value)} style={inputTableStyle}>
                    <option value="">Sin sucursal</option>
                    {sucursalesActivas.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={tdStyle}>
                  <select value={e.activo ? "true" : "false"} onChange={(ev) => editarEmpleadoLocal(e.id, "activo", ev.target.value === "true")} style={inputTableStyle}>
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </td>
                <td style={tdStyle}>
                  <button onClick={() => guardarEmpleado(e)} style={{ padding: 8, background: "#2962FF", color: "#fff", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer" }}>
                    Guardar
                  </button>
                </td>
              </tr>
            ))}
          </Tabla>
        </section>
      )}

      {seccionActiva === "sucursales" && (
        <section style={sectionStyle}>
          <h2>🏢 Administración de sucursales</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 15 }}>
            <input value={sucursalNombre} onChange={(e) => setSucursalNombre(e.target.value)} placeholder="Nombre sucursal" style={inputStyle} />
            <input value={sucursalLatitud} onChange={(e) => setSucursalLatitud(e.target.value)} placeholder="Latitud" style={inputStyle} />
            <input value={sucursalLongitud} onChange={(e) => setSucursalLongitud(e.target.value)} placeholder="Longitud" style={inputStyle} />
            <input value={sucursalRadio} onChange={(e) => setSucursalRadio(e.target.value)} placeholder="Radio metros" style={inputStyle} />

            <button onClick={agregarSucursal} style={{ padding: 12, background: "#2962FF", color: "#fff", border: "none", fontWeight: "bold", borderRadius: 8, cursor: "pointer" }}>
              Agregar sucursal
            </button>
          </div>

          <Tabla headers={["Sucursal", "Latitud", "Longitud", "Radio", "Estado", "Acción"]}>
            {sucursales.map((s) => (
              <tr key={s.id}>
                <td style={tdStyle}>{s.nombre}</td>
                <td style={tdStyle}>{s.latitud}</td>
                <td style={tdStyle}>{s.longitud}</td>
                <td style={tdStyle}>
                  <input defaultValue={s.radio_metros} onBlur={(e) => actualizarRadioSucursal(s.id, e.target.value)} style={{ padding: 8, width: 90, color: "#000", background: "#fff" }} /> m
                </td>
                <td style={tdStyle}>{s.activa ? "Activa" : "Inactiva"}</td>
                <td style={tdStyle}>
                  <button onClick={() => cambiarSucursalActiva(s)} style={{ padding: 8, background: s.activa ? "#D50000" : "#00C853", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
                    {s.activa ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
          </Tabla>
        </section>
      )}

      {seccionActiva === "registros" && (
        <section style={sectionStyle}>
          <h2>📍 Registros recientes</h2>

          <Tabla headers={["Fecha", "Empleado", "Sucursal", "Tipo", "Estado", "Puntualidad", "Distancia", "Selfie", "Mapa"]}>
            {asistencias.slice(0, 100).map((a) => (
              <tr key={a.id}>
                <td style={tdStyle}>{new Date(a.created_at).toLocaleString("es-MX")}</td>
                <td style={tdStyle}>{a.empleados_asistencia?.nombre || "Sin empleado"}</td>
                <td style={tdStyle}>{a.sucursales_asistencia?.nombre || "Sin sucursal"}</td>
                <td style={tdStyle}>{a.tipo}</td>
                <td style={tdStyle}>{a.estado || "-"}</td>
                <td style={tdStyle}>{a.puntualidad || "-"}</td>
                <td style={tdStyle}>{a.distancia_metros !== null ? `${Math.round(a.distancia_metros)} m` : "-"}</td>
                <td style={tdStyle}>
                  {a.foto_url ? (
                    <a href={a.foto_url} target="_blank" style={{ color: "#2563eb", fontWeight: "bold" }}>
                      Ver selfie
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td style={tdStyle}>
                  {a.latitud && a.longitud ? (
                    <a href={`https://maps.google.com/?q=${a.latitud},${a.longitud}`} target="_blank" style={{ color: "#2563eb", fontWeight: "bold" }}>
                      Ver mapa
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </Tabla>
        </section>
      )}
    </main>
  );
}