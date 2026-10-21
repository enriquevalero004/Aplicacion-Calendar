// Datos iniciales: asignaturas del máster, entregas conocidas y calendario académico 2026-27 (UPM).
// Archivo generado con datos/generar.py a partir de los JSON de la carpeta datos/. No editar a mano.

const SEED_SUBJECTS = [
  {
    "id": "s-53001586",
    "code": "53001586",
    "name": "Física Nuclear",
    "short": "Física Nuclear",
    "color": "#d50000",
    "semester": 1,
    "room": "Fdez. del Amo",
    "teachers": [
      "Rivera de Mena, Antonio Juan",
      "Oliva Gonzalo, Eduardo",
      "Cotelo Ferreiro, Manuel",
      "Velarde Mayol, Pedro"
    ],
    "schedule": [
      {
        "day": 0,
        "start": "17:30",
        "end": "19:20"
      }
    ]
  },
  {
    "id": "s-53001592",
    "code": "53001592",
    "name": "Termohidráulica Nuclear",
    "short": "Termohidráulica",
    "color": "#f6bf26",
    "semester": 1,
    "room": "Fdez. del Amo",
    "teachers": [
      "Cuervo Gómez, Diana",
      "Queral Salazar, José César",
      "Jiménez Varas, Gonzalo"
    ],
    "schedule": [
      {
        "day": 1,
        "start": "15:30",
        "end": "17:20"
      }
    ]
  },
  {
    "id": "s-53001593",
    "code": "53001593",
    "name": "Métodos Numéricos Avanzados",
    "short": "Métodos Numéricos",
    "color": "#33b679",
    "semester": 1,
    "room": "Fdez. del Amo",
    "teachers": [
      "Velarde Mayol, Pedro",
      "Cotelo Ferreiro, Manuel",
      "Kohanoff, Jorge José"
    ],
    "schedule": [
      {
        "day": 0,
        "start": "15:30",
        "end": "17:20"
      }
    ]
  },
  {
    "id": "s-53001594-s1",
    "code": "53001594-S1",
    "name": "Materiales bajo Irradiación",
    "short": "Materiales Irrad.",
    "color": "#039be5",
    "semester": 1,
    "room": "13",
    "teachers": [
      "González Arrabal, Raquel",
      "Kohanoff, Jorge José",
      "Peña Rodríguez, Ovidio Yordanis",
      "Garoz Gómez, David",
      "Rivera de Mena, Antonio Juan"
    ],
    "schedule": [
      {
        "day": 0,
        "start": "12:30",
        "end": "14:20"
      }
    ]
  },
  {
    "id": "s-53001596",
    "code": "53001596",
    "name": "Teoría del Transporte de Partículas y Radiación",
    "short": "Transporte",
    "color": "#7986cb",
    "semester": 1,
    "room": "Fdez. del Amo",
    "teachers": [
      "Peña Rodríguez, Ovidio Yordanis",
      "Rivera de Mena, Antonio Juan",
      "González Arrabal, Raquel",
      "Kohanoff, Jorge José"
    ],
    "schedule": [
      {
        "day": 2,
        "start": "15:30",
        "end": "17:20"
      }
    ]
  },
  {
    "id": "s-53001598",
    "code": "53001598",
    "name": "Fundamentos de los Nanosistemas",
    "short": "Nanosistemas",
    "color": "#d81b60",
    "semester": 1,
    "room": "Fdez. del Amo",
    "teachers": [
      "González Arrabal, Raquel",
      "Peña Rodríguez, Ovidio Yordanis",
      "Kohanoff, Jorge José"
    ],
    "schedule": [
      {
        "day": 2,
        "start": "17:30",
        "end": "19:20"
      }
    ]
  },
  {
    "id": "s-53001606",
    "code": "53001606",
    "name": "Tecnología de Radiaciones",
    "short": "Tec. Radiaciones",
    "color": "#f4511e",
    "semester": 1,
    "room": "Fdez. del Amo",
    "teachers": [
      "Río Redondo, Emma del",
      "González Arrabal, Raquel",
      "Rivera de Mena, Antonio Juan"
    ],
    "schedule": [
      {
        "day": 3,
        "start": "17:30",
        "end": "19:20"
      }
    ]
  },
  {
    "id": "s-53001587",
    "code": "53001587",
    "name": "Tecnologías Avanzadas en Reactores Nucleares",
    "short": "Reactores Avanz.",
    "color": "#e67c73",
    "semester": 2,
    "room": "",
    "teachers": [
      "Jiménez Varas, Gonzalo",
      "Castro González, Emilio"
    ],
    "schedule": [
      {
        "day": 3,
        "start": "12:30",
        "end": "14:20"
      }
    ]
  },
  {
    "id": "s-53001588",
    "code": "53001588",
    "name": "Seguridad Energética",
    "short": "Seg. Energética",
    "color": "#c0ca33",
    "semester": 2,
    "room": "",
    "teachers": [
      "Río Redondo, Emma del",
      "Cabellos de Francisco, Óscar Luis",
      "Cotelo Ferreiro, Manuel"
    ],
    "schedule": [
      {
        "day": 0,
        "start": "15:30",
        "end": "17:20"
      }
    ]
  },
  {
    "id": "s-53001589",
    "code": "53001589",
    "name": "Fusión Nuclear",
    "short": "Fusión",
    "color": "#0b8043",
    "semester": 2,
    "room": "",
    "teachers": [
      "Cotelo Ferreiro, Manuel",
      "Oliva Gonzalo, Eduardo",
      "Velarde Mayol, Pedro"
    ],
    "schedule": [
      {
        "day": 0,
        "start": "17:30",
        "end": "19:20"
      }
    ]
  },
  {
    "id": "s-53001590",
    "code": "53001590",
    "name": "Neutrónica",
    "short": "Neutrónica",
    "color": "#009688",
    "semester": 2,
    "room": "",
    "teachers": [
      "García Herranz, Nuria",
      "Cabellos de Francisco, Óscar Luis",
      "García Fernández, Gonzalo Felipe"
    ],
    "schedule": [
      {
        "day": 2,
        "start": "15:30",
        "end": "17:20"
      }
    ]
  },
  {
    "id": "s-53001591",
    "code": "53001591",
    "name": "Separación y Transmutación de Residuos Radiactivos",
    "short": "Transmutación",
    "color": "#3f51b5",
    "semester": 2,
    "room": "",
    "teachers": [
      "Río Redondo, Emma del",
      "Abánades Velasco, Alberto"
    ],
    "schedule": [
      {
        "day": 0,
        "start": "12:30",
        "end": "14:20"
      }
    ]
  },
  {
    "id": "s-53001595",
    "code": "53001595",
    "name": "Diseño de Reactores Nucleares",
    "short": "Diseño Reactores",
    "color": "#8e24aa",
    "semester": 2,
    "room": "",
    "teachers": [
      "García Herranz, Nuria",
      "Castro González, Emilio",
      "García Fernández, Gonzalo Felipe"
    ],
    "schedule": [
      {
        "day": 3,
        "start": "15:30",
        "end": "17:20"
      }
    ]
  },
  {
    "id": "s-53001599",
    "code": "53001599",
    "name": "Fiabilidad y Análisis del Riesgo",
    "short": "Fiabilidad",
    "color": "#ef8f00",
    "semester": 2,
    "room": "",
    "teachers": [
      "Cuervo Gómez, Diana",
      "Queral Salazar, José César"
    ],
    "schedule": [
      {
        "day": 1,
        "start": "15:30",
        "end": "17:20"
      }
    ]
  },
  {
    "id": "s-53001600",
    "code": "53001600",
    "name": "Seguridad Nuclear: Análisis de Accidentes Nucleares",
    "short": "Seg. Nuclear",
    "color": "#ad1457",
    "semester": 2,
    "room": "",
    "teachers": [
      "Jiménez Varas, Gonzalo",
      "Queral Salazar, José César",
      "Fernández Cosials, Kevin"
    ],
    "schedule": [
      {
        "day": 2,
        "start": "17:30",
        "end": "19:20"
      }
    ]
  },
  {
    "id": "s-53001601",
    "code": "53001601",
    "name": "Gestión de Residuos Radiactivos",
    "short": "Gestión Residuos",
    "color": "#9e9d24",
    "semester": 2,
    "room": "",
    "teachers": [
      "García Fernández, Gonzalo Felipe",
      "Elorza Tenreiro, Francisco Javier",
      "Fernández Cosials, Kevin"
    ],
    "schedule": [
      {
        "day": 1,
        "start": "17:30",
        "end": "21:20"
      }
    ]
  }
];

const SEED_TASKS = [
  {
    "id": "t-9950ce325f02",
    "subjectId": "s-53001593",
    "type": "trabajo",
    "title": "Trabajo nanoHUB (primera parte)",
    "date": "2026-11-08",
    "time": "23:59",
    "notes": "En Moodle aparece como «Evaluation». Trabajo de nanoHUB de la primera parte de la asignatura.",
    "remind": 1440
  },
  {
    "id": "t-a37bef966830",
    "subjectId": "s-53001596",
    "type": "trabajo",
    "title": "Tarea 1 - Desarrollo de código Monte Carlo",
    "date": "2026-11-15",
    "time": "23:00",
    "notes": "",
    "remind": 1440
  },
  {
    "id": "t-885879284bc4",
    "subjectId": "s-53001594-s1",
    "type": "ejercicios",
    "title": "Exercise 1 - Thermal response and atomistic defects",
    "date": "2027-01-12",
    "time": "23:59",
    "notes": "",
    "remind": 1440
  }
];

const ACADEMIC = {
  "year": "2026-2027",
  "semesters": {
    "1": {
      "start": "2026-09-07",
      "end": "2026-12-22"
    },
    "2": {
      "start": "2027-02-01",
      "end": "2027-05-24"
    }
  },
  "holidays": [
    "2026-10-12",
    "2026-11-02",
    "2026-11-09",
    "2026-12-07",
    "2026-12-08",
    "2026-12-25",
    "2027-01-01",
    "2027-01-06",
    "2027-01-28",
    "2027-03-25",
    "2027-03-26",
    "2027-05-03"
  ],
  "vacations": [
    {
      "start": "2026-12-23",
      "end": "2027-01-05",
      "name": "Navidad"
    },
    {
      "start": "2027-03-22",
      "end": "2027-03-26",
      "name": "Semana Santa"
    },
    {
      "start": "2027-08-01",
      "end": "2027-08-31",
      "name": "Verano"
    }
  ],
  "noTeaching": [
    {
      "start": "2026-09-01",
      "end": "2026-09-04",
      "name": "Lectivos sin docencia"
    },
    {
      "start": "2026-11-19",
      "end": "2026-11-20",
      "name": "UPM Conecta / IRM"
    },
    {
      "start": "2027-01-07",
      "end": "2027-01-07",
      "name": "Lectivo sin docencia"
    },
    {
      "start": "2027-01-29",
      "end": "2027-01-29",
      "name": "Lectivo sin docencia"
    },
    {
      "start": "2027-03-15",
      "end": "2027-03-16",
      "name": "UPM Conecta / IRM"
    },
    {
      "start": "2027-03-29",
      "end": "2027-03-29",
      "name": "Lectivo sin docencia"
    },
    {
      "start": "2027-05-17",
      "end": "2027-05-17",
      "name": "Lectivo sin docencia"
    },
    {
      "start": "2027-05-25",
      "end": "2027-05-27",
      "name": "Lectivos sin docencia"
    },
    {
      "start": "2027-06-17",
      "end": "2027-06-18",
      "name": "Lectivos sin docencia"
    },
    {
      "start": "2027-06-21",
      "end": "2027-06-23",
      "name": "Lectivos sin docencia"
    },
    {
      "start": "2027-07-15",
      "end": "2027-07-31",
      "name": "Lectivos sin docencia"
    }
  ],
  "examPeriods": [
    {
      "start": "2027-01-08",
      "end": "2027-01-27",
      "name": "Exámenes 1.er cuatrimestre"
    },
    {
      "start": "2027-05-28",
      "end": "2027-06-16",
      "name": "Exámenes 2.º cuatrimestre"
    },
    {
      "start": "2027-06-24",
      "end": "2027-06-30",
      "name": "Exámenes 2.º cuatrimestre"
    },
    {
      "start": "2027-07-01",
      "end": "2027-07-14",
      "name": "Exámenes extraordinarios"
    }
  ],
  "pec": [
    {
      "start": "2026-10-26",
      "end": "2026-10-30"
    },
    {
      "start": "2026-12-16",
      "end": "2026-12-22"
    },
    {
      "start": "2027-04-05",
      "end": "2027-04-12"
    },
    {
      "start": "2027-05-18",
      "end": "2027-05-24"
    }
  ],
  "swaps": {
    "2026-10-13": 0,
    "2026-11-04": 0,
    "2027-04-02": 0,
    "2027-04-15": 0,
    "2027-05-05": 0
  }
};
