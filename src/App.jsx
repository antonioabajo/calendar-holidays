import React, { useState, useMemo, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc
} from 'firebase/firestore';

// --- ICONOS SVG INTEGRADOS (Garantizan que se vea igual sin dependencias externas) ---
const Icon = ({ d, size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);

const CalendarIcon = (p) => <Icon {...p} d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />;
const UsersIcon = (p) => <Icon {...p} d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />;
const AlertIcon = (p) => <Icon {...p} d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3ZM12 9v4M12 17h.01" />;
const TrashIcon = (p) => <Icon {...p} d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />;
const CheckIcon = (p) => <Icon {...p} d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3" />;
const PlusIcon = (p) => <Icon {...p} d="M12 5v14M5 12h14" />;
const MapPinIcon = (p) => <Icon {...p} d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0ZM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />;
const LeftIcon = (p) => <Icon {...p} d="m15 18-6-6 6-6" />;
const RightIcon = (p) => <Icon {...p} d="m9 18 6-6-6-6" />;
const ListIcon = (p) => <Icon {...p} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />;
const GridIcon = (p) => <Icon {...p} d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />;
const CloudIcon = (p) => <Icon {...p} d="M17.5 19c2.5 0 4.5-2 4.5-4.5 0-2.4-1.9-4.3-4.3-4.5C16.9 6.8 13.7 4 10 4 6.7 4 4 6.7 4 10c-2.2.3-4 2.2-4 4.5C0 17 2 19 4.5 19" />;
const CloudOffIcon = (p) => <Icon {...p} d="m2 2 20 20M5.78 5.78l-.28.22C2.2 6.3 0 9.2 0 12.5 0 16.1 2.9 19 6.5 19h10.72M22.56 16.56A4.5 4.5 0 0 0 18 9c-.28 0-.56.03-.82.09C16.3 5.4 13.1 3 9.5 3c-.5 0-.98.05-1.44.15" />;
const LoaderIcon = (p) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`animate-spin ${p.className}`}><path d="M21 12a9 9 0 1 1-6.21-8.56"/></svg>;
const CalendarDaysIcon = (p) => <Icon {...p} d="M21 10H3M16 2v4M8 2v4M3 6h18a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />;
const LockIcon = (p) => <Icon {...p} d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2Z M7 11V7a5 5 0 0 1 10 0v4" />;
const LogOutIcon = (p) => <Icon {...p} d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9" />;

// --- CONFIGURACIÓN DE DATOS MAESTROS ---
const INITIAL_USERS = [
  { id: 'carlos', name: 'Carlos', totalDays: 24, region: 'Asturias', color: 'bg-blue-600', colorLight: 'bg-blue-100', text: 'text-blue-700' },
  { id: 'antonio', name: 'Antonio', totalDays: 24, region: 'Madrid', color: 'bg-emerald-600', colorLight: 'bg-emerald-100', text: 'text-emerald-700' },
  { id: 'ricardo', name: 'Ricardo', totalDays: 24, region: 'Granada', color: 'bg-purple-600', colorLight: 'bg-purple-100', text: 'text-purple-700' }
];

const HOLIDAYS_2026 = {
  Nacional: [
    { date: '2026-01-01', name: 'Año Nuevo' }, { date: '2026-01-06', name: 'Epifanía' },
    { date: '2026-04-03', name: 'Viernes Santo' }, { date: '2026-05-01', name: 'Trabajo' },
    { date: '2026-08-15', name: 'Asunción' }, { date: '2026-10-12', name: 'Fiesta Nacional' },
    { date: '2026-11-02', name: 'Todos los Santos' }, { date: '2026-12-07', name: 'Constitución' },
    { date: '2026-12-08', name: 'Inmaculada' }, { date: '2026-12-25', name: 'Navidad' }
  ],
  Madrid: [
    { date: '2026-04-02', name: 'Jueves Santo' }, { date: '2026-05-02', name: 'Comunidad' },
    { date: '2026-05-15', name: 'San Isidro' }, { date: '2026-11-09', name: 'La Almudena' }
  ],
  Asturias: [
    { date: '2026-04-02', name: 'Jueves Santo' }, { date: '2026-09-08', name: 'Día de Asturias' }
  ],
  Granada: [
    { date: '2026-02-28', name: 'Día de Andalucía' }, { date: '2026-04-02', name: 'Jueves Santo' },
    { date: '2026-05-26', name: 'Mariana Pineda' }, { date: '2026-06-04', name: 'Corpus Christi' }
  ]
};

// --- COMPONENTES ---
const CustomDatePicker = ({ label, value, onChange, userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date(2026, 2, 1)); 

  useEffect(() => { if (value) setViewDate(new Date(value)); }, [value]);

  const user = INITIAL_USERS.find(u => u.id === userId);
  const region = user?.region;
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  const renderDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    let offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const days = [];
    for (let i = 0; i < offset; i++) days.push(<div key={`e-${i}`} />);

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isNat = HOLIDAYS_2026.Nacional.find(h => h.date === dateStr);
      const isReg = region ? HOLIDAYS_2026[region]?.find(h => h.date === dateStr) : null;
      const isWeekend = [0, 6].includes(new Date(year, month, d).getDay());
      const isSelected = value === dateStr;

      let style = "hover:bg-blue-50 text-gray-700";
      if (isSelected) style = "bg-blue-600 text-white font-bold shadow-sm";
      else if (isNat) style = "bg-red-100 text-red-700 font-semibold border border-red-200";
      else if (isReg) style = "bg-orange-100 text-orange-700 font-semibold border border-orange-200";
      else if (isWeekend) style = "bg-gray-50 text-gray-400";

      days.push(
        <button key={d} type="button" onClick={() => { onChange(dateStr); setIsOpen(false); }}
          className={`h-8 w-full rounded-md flex items-center justify-center text-[10px] transition-all ${style}`}
          title={isNat?.name || isReg?.name || ""}>
          {d}
        </button>
      );
    }
    return days;
  };

  return (
    <div className="relative">
      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{label}</label>
      <div onClick={() => setIsOpen(!isOpen)} className="w-full border border-slate-200 rounded-xl p-3 bg-white cursor-pointer flex justify-between items-center hover:border-blue-500 transition-colors shadow-sm">
        <span className={value ? "text-slate-900 text-sm font-medium" : "text-slate-300 text-sm"}>
          {value ? new Date(value).toLocaleDateString('es-ES') : "Seleccionar fecha"}
        </span>
        <CalendarIcon size={16} className="text-slate-400" />
      </div>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute z-50 mt-2 bg-white border border-slate-200 shadow-2xl rounded-2xl p-4 w-64 left-0 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-3">
              <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"><LeftIcon size={16}/></button>
              <span className="font-bold text-xs text-slate-700">{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
              <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"><RightIcon size={16}/></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-[9px] font-black text-slate-300 text-center mb-1 uppercase">
              {['L','M','X','J','V','S','D'].map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">{renderDays()}</div>
          </div>
        </>
      )}
    </div>
  );
};

// --- APP PRINCIPAL ---
export default function App() {
  // --- ESTADOS DE ACCESO ---
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('vacas_auth_pro') === 'true');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [isReady, setIsReady] = useState(false);
  const [sessionUser, setSessionUser] = useState(null);
  const [vacations, setVacations] = useState([]);
  const [newUser, setNewUser] = useState('carlos');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [viewMode, setViewMode] = useState('calendar');
  const [calUserFilter, setCalUserFilter] = useState('all');
  const [msg, setMsg] = useState({ text: '', type: '' });
  
  const [db, setDb] = useState(null);
  const [cloudActive, setCloudActive] = useState(false);
  
  // ID FIJO: Asegura que la base de datos lea siempre la misma "carpeta" 
  // independientemente de dónde compiles el código.
  const STABLE_APP_ID = 'vacaciones-equipo-2026'; 

  // EFECTO DE INICIALIZACIÓN Y CARGA
  useEffect(() => {
    const initProject = () => {
      // Inyectar Tailwind CDN
      if (!document.getElementById('tailwind-cdn')) {
        const script = document.createElement('script');
        script.id = 'tailwind-cdn';
        script.src = 'https://cdn.tailwindcss.com';
        document.head.appendChild(script);
      }
      
      const checkTailwind = setInterval(() => {
        if (window.tailwind) {
          setIsReady(true);
          clearInterval(checkTailwind);
        }
      }, 50);
    };
    initProject();

    // TU CONFIGURACIÓN DE FIREBASE (Usa exclusivamente variables de entorno)
    let envConfig = {};
    try {
      envConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
        measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
      };
    } catch (e) {
      // Manejar error si import.meta.env no está disponible
    }

    const firebaseConfig = {
      apiKey: envConfig.apiKey,
      authDomain: envConfig.authDomain,
      projectId: envConfig.projectId,
      storageBucket: envConfig.storageBucket,
      messagingSenderId: envConfig.messagingSenderId,
      appId: envConfig.appId,
      measurementId: envConfig.measurementId
    };

    try {
      // Si falta la apiKey (ej. entorno sin variables), activamos modo local
      if (!firebaseConfig.apiKey) {
        console.warn("Variables de entorno no encontradas. Activando modo local.");
        setCloudActive(false);
        setSessionUser({ uid: 'local-admin' });
        const saved = localStorage.getItem('vacas_v_final_data_pro');
        if (saved) setVacations(JSON.parse(saved));
      } else {
        // Inicialización real en tu propia base de datos
        const fbApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
        const fbAuth = getAuth(fbApp);
        const fbDb = getFirestore(fbApp);
        setDb(fbDb);
        setCloudActive(true);
        
        // Forzamos autenticación anónima para acceder a tus reglas
        signInAnonymously(fbAuth).then(() => onAuthStateChanged(fbAuth, setSessionUser)).catch(e => {
          console.error("Error Auth Firebase:", e);
        });
      }
    } catch (e) {
      console.warn("Fallo general al conectar con Firebase.", e);
      setCloudActive(false);
      setSessionUser({ uid: 'local-admin' });
    }
  }, []);

  // Sincronización Firestore
  useEffect(() => {
    if (!sessionUser || !cloudActive || !db) return;
    
    // Ruta inamovible en tu base de datos
    const path = collection(db, 'artifacts', STABLE_APP_ID, 'public', 'data', 'vacaciones');
    const unsubscribe = onSnapshot(path, (snapshot) => {
      setVacations(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      console.error("Error al leer datos (Revisa tus Reglas de Firestore):", error);
    });

    return () => unsubscribe();
  }, [sessionUser, cloudActive, db]);

  // Sincronización Local (Fallback)
  useEffect(() => {
    if (!cloudActive && vacations.length >= 0) {
      localStorage.setItem('vacas_v_final_data_pro', JSON.stringify(vacations));
    }
  }, [vacations, cloudActive]);

  const userBalances = useMemo(() => {
    return INITIAL_USERS.map(u => {
      const used = vacations.filter(v => v.userId === u.id).reduce((sum, v) => sum + v.days, 0);
      return { ...u, used, remaining: u.totalDays - used };
    });
  }, [vacations]);

  const calculateDays = (start, end, uid) => {
    let count = 0; let curr = new Date(start); const stop = new Date(end);
    const reg = INITIAL_USERS.find(u => u.id === uid)?.region;
    const holidays = [...HOLIDAYS_2026.Nacional, ...(HOLIDAYS_2026[reg] || [])].map(h => h.date);
    while (curr <= stop) {
      const dStr = curr.toISOString().split('T')[0];
      if (![0, 6].includes(curr.getDay()) && !holidays.includes(dStr)) count++;
      curr.setDate(curr.getDate() + 1);
    }
    return count;
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newStart || !newEnd) return setMsg({ text: 'Elige fechas', type: 'error' });
    const days = calculateDays(newStart, newEnd, newUser);
    if (days <= 0) return setMsg({ text: 'Rango no válido', type: 'error' });
    const bal = userBalances.find(u => u.id === newUser);
    if (bal.remaining < days) return setMsg({ text: 'Días insuficientes', type: 'error' });

    const entry = { userId: newUser, userName: bal.name, startDate: newStart, endDate: newEnd, days, status: 'Aprobado' };

    if (cloudActive && db) {
      try {
        const docRef = doc(collection(db, 'artifacts', STABLE_APP_ID, 'public', 'data', 'vacaciones'));
        await setDoc(docRef, entry);
        setMsg({ text: 'Guardado en tu Nube', type: 'success' });
      } catch (err) {
        console.error(err);
        setMsg({ text: 'Permiso denegado en tu BDD', type: 'error' });
      }
    } else {
      setVacations(prev => [...prev, { ...entry, id: Date.now().toString() }]);
      setMsg({ text: 'Guardado Localmente', type: 'success' });
    }
    setNewStart(''); setNewEnd(''); setCalUserFilter(newUser);
    setTimeout(() => setMsg({ text: '', type: '' }), 3000);
  };

  const removeVaca = async (id) => {
    if (cloudActive && db) await deleteDoc(doc(db, 'artifacts', STABLE_APP_ID, 'public', 'data', 'vacaciones', id));
    else setVacations(prev => prev.filter(v => v.id !== id));
  };

  const handleLogin = (e) => {
    e.preventDefault();
    // Aquí puedes cambiar la contraseña por la que quieras
    if (password === 'equipo2026') {
      setIsLoggedIn(true);
      localStorage.setItem('vacas_auth_pro', 'true');
      setLoginError('');
    } else {
      setLoginError('Contraseña incorrecta');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setPassword('');
    localStorage.removeItem('vacas_auth_pro');
  };

  const renderCalendarView = () => {
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return (
      <div className="space-y-6 animate-in fade-in duration-700">
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm gap-4">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calendario de Equipo</span>
          <select value={calUserFilter} onChange={(e) => setCalUserFilter(e.target.value)} className="text-sm bg-slate-50 border border-slate-200 rounded-2xl px-6 py-2 outline-none font-bold text-slate-700 cursor-pointer focus:ring-4 focus:ring-blue-50 transition-all">
            <option value="all">Ver todo el equipo</option>
            {INITIAL_USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {months.map((mName, mIdx) => {
            const daysInMonth = new Date(2026, mIdx + 1, 0).getDate();
            const first = new Date(2026, mIdx, 1).getDay();
            let offset = first === 0 ? 6 : first - 1;
            const grid = [];
            for(let i=0; i<offset; i++) grid.push(<div key={`off-${i}`} />);
            for(let d=1; d<=daysInMonth; d++) {
              const dStr = `2026-${String(mIdx+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
              const isToday = dStr === '2026-03-08';
              const isSun = new Date(2026, mIdx, d).getDay() === 0;
              const isNat = HOLIDAYS_2026.Nacional.some(h => h.date === dStr);
              const activeVacs = vacations.filter(v => dStr >= v.startDate && dStr <= v.endDate);
              const userOnVaca = activeVacs.find(v => v.userId === calUserFilter);

              let cellStyle = "text-slate-500";
              if (isSun || isNat) cellStyle = "text-red-500 font-bold";
              let bg = "";
              if (calUserFilter !== 'all' && userOnVaca) bg = INITIAL_USERS.find(u => u.id === calUserFilter).color;
              else if (isToday) bg = "ring-2 ring-slate-800 ring-inset rounded-xl";

              grid.push(
                <div key={d} className={`h-10 flex flex-col items-center justify-center relative rounded-xl transition-all ${bg} ${bg && calUserFilter !== 'all' ? 'text-white shadow-md' : ''}`}>
                  <span className={`text-[11px] ${cellStyle} ${bg && calUserFilter !== 'all' ? 'text-white' : ''}`}>{d}</span>
                  {calUserFilter === 'all' && activeVacs.length > 0 && (
                    <div className="flex gap-0.5 absolute bottom-1.5">
                      {activeVacs.map(v => (
                        <div key={`${v.id}-${v.userId}`} className={`w-1.5 h-1.5 rounded-full border border-white ${INITIAL_USERS.find(u => u.id === v.userId)?.color}`} />
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <div key={mName} className="bg-white border border-slate-100 rounded-[32px] shadow-sm overflow-hidden flex flex-col hover:shadow-2xl transition-all">
                <div className="bg-slate-50 py-3 text-center text-[10px] font-black border-b border-slate-100 uppercase tracking-widest text-slate-400">{mName} 2026</div>
                <div className="grid grid-cols-7 gap-1 p-4 flex-1">
                  {['L','M','X','J','V','S','D'].map(h => <div key={h} className="text-[9px] text-slate-300 text-center font-black pb-2">{h}</div>)}
                  {grid}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!isReady) return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center z-[9999]">
      <LoaderIcon className="text-blue-600 mb-4" size={48} />
      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">Iniciando Panel de Gestión...</p>
    </div>
  );

  // --- PANTALLA DE ACCESO (LOGIN) ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
        <div className="bg-white p-10 rounded-[40px] shadow-xl border border-slate-100 w-full max-w-md animate-in zoom-in-95 duration-500">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="bg-blue-50 p-5 rounded-full mb-5">
              <LockIcon className="text-blue-600" size={36} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Acceso Restringido</h1>
            <p className="text-sm text-slate-500 mt-2">Introduce la contraseña del equipo para continuar</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña..."
                className="w-full border-2 border-slate-50 rounded-2xl p-4 text-center font-bold text-slate-800 outline-none focus:bg-white focus:ring-8 focus:ring-blue-50 focus:border-blue-500 transition-all shadow-sm"
              />
              {loginError && <p className="text-red-500 text-xs font-bold text-center mt-3 animate-in slide-in-from-top-1">{loginError}</p>}
            </div>
            <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-blue-600 hover:-translate-y-1 transition-all shadow-lg active:scale-95">
              Entrar al Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-4 uppercase">
              <CalendarIcon className="text-blue-600" size={36} /> Panel Equipo
            </h1>
            <div className="flex items-center gap-3">
              {cloudActive ? (
                <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100 uppercase tracking-widest shadow-sm"><CloudIcon size={14} /> Tu Nube Activa</span>
              ) : (
                <span className="flex items-center gap-1.5 text-[10px] font-black text-amber-500 bg-amber-50 px-4 py-1.5 rounded-full border border-amber-100 uppercase tracking-widest shadow-sm"><CloudOffIcon size={14} /> Offline Mode</span>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <nav className="flex bg-white rounded-3xl shadow-sm border border-slate-100 p-2 w-full md:w-auto overflow-x-auto">
              <button onClick={() => setViewMode('list')} className={`px-6 py-3 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>Lista</button>
              <button onClick={() => setViewMode('gantt')} className={`px-6 py-3 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'gantt' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>Gantt</button>
              <button onClick={() => setViewMode('calendar')} className={`px-6 py-3 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'calendar' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>Calendario</button>
            </nav>
            <button onClick={handleLogout} className="flex items-center gap-2 bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 px-5 py-3 rounded-3xl border border-slate-100 shadow-sm transition-all text-xs font-black uppercase tracking-widest">
              <LogOutIcon size={18} /> Salir
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {userBalances.map(u => (
            <div key={u.id} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-2xl transition-all duration-700">
              <div className={`absolute top-0 left-0 w-2.5 h-full ${u.color} opacity-80`} />
              <div className="flex justify-between items-start mb-10">
                <div><h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-2 uppercase">{u.name}</h3><span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest"><MapPinIcon size={12} /> {u.region}</span></div>
                <div className="text-right"><div className="text-5xl font-black text-slate-900 leading-none tracking-tighter">{u.remaining}</div><div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-2">Días Libres</div></div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-400"><span>Progreso</span><span className="text-slate-800">{u.used} de {u.totalDays}</span></div>
                <div className="bg-slate-100 h-4 rounded-full overflow-hidden shadow-inner border border-slate-50 p-0.5"><div className={`${u.color} h-full transition-all duration-1000 ease-in-out rounded-full shadow-md`} style={{ width: `${(u.used / u.totalDays) * 100}%` }} /></div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-20">
          <section className="lg:col-span-4 bg-white p-8 rounded-[48px] border border-slate-100 shadow-sm space-y-8 animate-in slide-in-from-left duration-700">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Añadir Solicitud</h2>
            {msg.text && (<div className={`p-5 rounded-3xl text-xs font-bold flex items-center gap-3 animate-in slide-in-from-top-4 border-2 ${msg.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>{msg.type === 'error' ? <AlertIcon size={20}/> : <CheckIcon size={20}/>} {msg.text}</div>)}
            <form onSubmit={handleAdd} className="space-y-6">
              <div className="space-y-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Persona</label><select value={newUser} onChange={(e) => setNewUser(e.target.value)} className="w-full border-2 border-slate-50 rounded-2xl p-4 bg-slate-50 font-black text-slate-800 outline-none focus:bg-white focus:ring-8 focus:ring-blue-50 transition-all cursor-pointer shadow-sm">{INITIAL_USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
              <CustomDatePicker label="Desde" value={newStart} onChange={setNewStart} userId={newUser} /><CustomDatePicker label="Hasta" value={newEnd} onChange={setNewEnd} userId={newUser} />
              <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-[32px] font-black text-sm uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-blue-600 hover:-translate-y-2 transition-all shadow-2xl active:scale-95 mt-6"><PlusIcon size={20} /> Guardar Registro</button>
            </form>
          </section>

          <section className="lg:col-span-8 bg-white rounded-[48px] border border-slate-100 shadow-sm p-10 overflow-hidden min-h-[600px]">
            {viewMode === 'list' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="text-left text-[10px] text-slate-300 uppercase font-black tracking-widest border-b border-slate-50"><th className="pb-8 px-4">Empleado</th><th className="pb-8">Fechas</th><th className="pb-8 text-center">Laborables</th><th className="pb-8 text-right pr-8">Acción</th></tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {vacations.length === 0 ? <tr><td colSpan="4" className="py-32 text-center text-slate-200 italic font-bold text-xl uppercase tracking-tighter">Historial vacío</td></tr> : 
                    vacations.sort((a,b) => new Date(a.startDate) - new Date(b.startDate)).map(v => (
                      <tr key={v.id} className="group hover:bg-slate-50 transition-all"><td className="py-8 px-4"><div className="flex items-center gap-4 font-black text-slate-800 text-xl tracking-tighter uppercase"><span className={`w-4 h-4 rounded-full shadow-md ${INITIAL_USERS.find(u => u.id === v.userId)?.color}`} />{v.userName}</div></td><td className="text-sm text-slate-500 font-black">{new Date(v.startDate).toLocaleDateString('es-ES')} <span className="text-slate-200 mx-2">—</span> {new Date(v.endDate).toLocaleDateString('es-ES')}</td><td className="text-center"><span className="bg-slate-100 text-slate-800 text-xs font-black px-5 py-2 rounded-2xl border-2 border-slate-50 shadow-sm">{v.days} d.</span></td><td className="text-right pr-4"><button onClick={() => removeVaca(v.id)} className="text-slate-200 hover:text-red-500 transition-all p-4 hover:bg-red-50 rounded-3xl"><TrashIcon size={24}/></button></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {viewMode === 'gantt' && (
              <div className="overflow-x-auto pb-8 scrollbar-hide">
                <div className="min-w-[1000px] space-y-10 pt-10 px-4">
                  <div className="flex mb-6 border-b border-slate-100 pb-8"><div className="w-56 sticky left-0 bg-white z-10 font-black text-[11px] text-slate-300 uppercase tracking-widest text-left">Plan Anual</div><div className="flex-1 grid grid-cols-12 text-center text-[11px] font-black text-slate-300 uppercase tracking-widest">{["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"].map(m => <div key={m}>{m}</div>)}</div></div>
                  {INITIAL_USERS.map(u => (
                    <div key={u.id} className="flex h-20 items-center group transition-all text-left"><div className="w-56 sticky left-0 bg-white z-10 text-xl font-black text-slate-800 flex items-center gap-4 uppercase tracking-tighter text-left"><span className={`w-4 h-4 rounded-full shadow-lg ${u.color}`} /> {u.name}</div><div className="flex-1 h-16 relative bg-slate-50 rounded-[32px] mx-4 shadow-inner border-2 border-slate-100 overflow-hidden"><div className="absolute inset-0 grid grid-cols-12 pointer-events-none">{[...Array(12)].map((_, i) => <div key={i} className="border-r border-slate-200/50 h-full last:border-0" />)}</div>
                    {vacations.filter(v => v.userId === u.id).map(v => {
                      const start = new Date(v.startDate); const end = new Date(v.endDate); const totalMs = new Date(2026, 11, 31) - new Date(2026, 0, 1);
                      const left = ((start - new Date(2026, 0, 1)) / totalMs) * 100; const width = ((end - start) / totalMs) * 100 + 0.5;
                      return (<div key={v.id} className={`absolute h-full ${u.color} shadow-2xl cursor-help hover:brightness-110 border-x-8 border-white/5 transition-all`} style={{ left: `${left}%`, width: `${width}%` }} title={`${v.userName}: ${v.startDate} al ${v.endDate}`} />);
                    })}</div></div>
                  ))}
                </div>
              </div>
            )}
            {viewMode === 'calendar' && renderCalendarView()}
          </section>
        </div>
      </div>
    </div>
  );
}