import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../db/conexion.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================
// DATOS (generados a partir del archivo .db corregido)
// ============================================

const calles = [
  [1, "Arenales"],
  [2, "Anzoátegui"],
  [3, "Aniceto Latorre"],
  [4, "12 de Octubre"],
  [5, "O´Higgins"],
  [6, "Ameghino"],
  [7, "Necochea"],
  [8, "Alsina"],
  [9, "Av. Entre Rios"],
  [10, "Rivadavia"],
  [11, "Leguizamón"],
  [12, "Santiago del Estero"],
  [13, "General Martín Güemes"],
  [14, "Av. Belgrano"],
  [15, "España"],
  [16, "Caseros"],
  [17, "Alvarado"],
  [18, "Urquiza"],
  [19, "Av. San Martín"],
  [20, "Mendoza"],
  [21, "San Juan"],
  [22, "San Luis"],
  [23, "La Rioja"],
  [24, "Tucumán"],
  [25, "Corrientes"],
  [26, "Zabala"],
  [27, "Ibazeta"],
  [28, "Martín Cornejo"],
  [29, "Almirante Brown"],
  [30, "Simón Bolivar"],
  [31, "Marcelo T. de Alvear"],
  [32, "Dr. Adolfo Güemes"],
  [33, "Av. Sarmiento"],
  [34, "25 de Mayo"],
  [35, "20 de Febrero"],
  [36, "Balcarce"],
  [37, "Mitre"],
  [38, "Zuviría"],
  [39, "Dean Funes"],
  [40, "Pueyrredón"],
  [41, "Vicente López"],
  [42, "Juramento"],
  [43, "Av. Bicentenario de la Batalla de Salta"],
  [44, "Laprida"],
  [45, "10 de Octubre"],
  [46, "Lamadrid"],
  [47, "General Paz"],
  [48, "Gorriti"],
  [49, "Islas Malvinas"],
  [50, "Av. Jujuy"],
  [51, "Pellegrini"],
  [52, "Ituzaingó"],
  [53, "La Florida"],
  [54, "Alberdi"],
  [55, "Buenos Aires"],
  [56, "Córdoba"],
  [57, "Lerma"],
  [58, "Catamarca"],
  [59, "Santa Fe"],
  [60, "Lavalle"],
  [61, "Av. Hipólito Yrigoyen"],
  [62, "Av. Juan Domingo Peron"],
  [63, "Av. Monseñor Tavella"],
  [64, "Av. de Circunvalación Papa Juan XXIII"],
  [65, "Entrada Supermercado Hiper Libertad"],
  [66, "Esteco"],
  [67, "Orán"],
  [68, "Av. República del Líbano"],
  [69, "Av. Chile"],
  [70, "Virgilio Tedín"],
  [71, "Juan Carlos Davalos"],
  [72, "Av. Ragone"],
  [73, "Ing. Abel Cornejo"],
  [74, "Pje. Zorrilla"],
  [75, "Rondeau"],
  [76, "Av. Independencia"],
  [77, "Av. Constitución Nacional"],
  [78, "Av. Houssay Bernardo Doctor"],
  [79, "Av. Bolivia"],
  [80, "Los Curupayes"],
  [81, "Los Damascos"],
  [82, "Republica de Siria"]
];

const lineas = [
  [1, "1A"],
  [2, "1B"],
  [3, "1C"],
  [4, "2A"],
  [5, "2B Floresta"],
  [6, "2B Parque Industrial"],
  [7, "2B Villa Mitre"],
  [8, "2C"],
  [9, "2D"],
  [10, "2E"],
  [11, "2E Articulado"],
  [12, "2F"],
  [13, "2F Pedreras"],
  [14, "2G"],
  [15, "2G Nocturno"],
  [16, "3A"],
  [17, "3B"],
  [18, "3C"],
  [19, "3E"],
  [20, "4A R. Romero"],
  [21, "4A Sauce"],
  [22, "4B"],
  [23, "4C"],
  [24, "4C Progreso"],
  [25, "4D"],
  [26, "4D Ceibal"],
  [27, "4E"],
  [28, "5A Catolica"],
  [29, "5A Profesionales"],
  [30, "5A Samson"],
  [31, "5B"],
  [32, "5C"],
  [33, "5D Huaico Mirasoles"],
  [34, "6A"],
  [35, "6A Huaico II"],
  [36, "6B"],
  [37, "6B J. M. Rosas"],
  [38, "6C"],
  [39, "6D Huaico Mirasoles"],
  [40, "7 Enlace 1ro Mayo"],
  [41, "7A"],
  [42, "7B"],
  [43, "7C Convivencia"],
  [44, "7C Solidaridad"],
  [45, "7CD Articulado"],
  [46, "7D"],
  [47, "7D Justicia"],
  [48, "7E Articulado"],
  [49, "7E Circulo"],
  [50, "7E Pinares"],
  [51, "8A"],
  [52, "8B"],
  [53, "8C"]
];

const paradas = [
  [1, 19, 55, -24.79368383655699, -65.40970172487158, "Sobre Av. San Martín, a 10 metros de la esquina con Buenos Aires.", "Poste de metal con relieve. La vereda cuenta con baldosas guía."],
  [2, 14, 37, -24.787661748665027, -65.41177294715105, "Sobre Av. Belgrano, frente a la farmacia Fleming.", "Poste de metal, con cesto de basura integrado"],
  [3, 19, 52, -24.793159121495794, -65.41457370725622, "Sobre Av. San Martín a 15 metros pasando Ituzaingó", "Poste de metal, en vereda ancha"],
  [4, 14, 37, -24.787722384932444, -65.41111528304327, "Sobre Av. Belgrano 5 metros antes de llegar a calle Mitre", "Poste de metal, en vereda amplia. Fuera del Banco Nacional"],
  [5, 57, 20, -24.795239051471732, -65.40725861590909, "Sobre calle Lerma, esquina Mendoza", "Poste de metal, al borde de la esquina y pegado a una rampa para sillas de ruedas."],
  [6, 51, 21, -24.796055990328338, -65.41571842268013, "Sobre Pellegrini a 5 metros de calle San Juan", "Poste de cemento sólido. Vereda amplia."],
  [7, 9, 33, -24.78095273109147, -65.4149480927063, "Sobre avenida Entre Rios, a las afueras del Monoblock Salta", "Parada con Garita de espera. Cuenta con vereda amplia"],
  [8, 43, 74, -24.787871418210436, -65.4024805822512, "Sobre la Av. del Bicentenario, en la Plazoleta Doctor Arturo Oñativia.", "Parada con garita de espera, con vereda amplia"],
  [9, 35, 16, -24.78927526233031, -65.41381801873762, "Sobre calle 20 de Febrero a 15 metros de calle Caseros.", "Poste de metal con cesto de basura integrado."],
  [10, 38, 10, -24.78270170652911, -65.40892317056675, "Sobre Zuviría esquina Rivadavia, a las afueras del Frigorífico La Florida", "Poste de metal, con vereda amplia, muy cerca de un poste de cemento sólido."],
  [11, 62, 64, -24.77839698654846, -65.43180177855396, "Sobre Av. Juan Domingo Perón a escasos metros de la esquina", "Pequeño poste de madera, al borde de la vereda"],
  [12, 63, 65, -24.829283260836775, -65.42944918621147, "Sobre Av. Monseñor Tavella a 20 metros de la entrada del Hiper Libertad", "Parada con Garita de espera."],
  [13, 76, 75, -24.808243313550093, -65.40561231605494, "Sobre Av. Independencia a metros de la esquina con Rondeau", "Poste de madera, al costado de una caja de distribución de Telecom"],
  [14, 22, 58, -24.797799185426523, -65.40627904235971, "Sobre calle San Luis a metros de la esquina con calle Catamarca", "Sin postes ni garitas, con un portón metálico contra la pared"],
  [15, 57, 22, -24.797825924264735, -65.40746087560838, "Sobre calle Lerma, esquina San Luis", "Poste de madera, con vereda amplia, a metros de un árbol"],
  [16, 52, 20, -24.7942937578915, -65.41417703486182, "Sobre calle Ituzaingó fuera del supermercado Vea", "Poste de metal con vereda semi amplia."],
  [17, 22, 45, -24.796479261966862, -65.424224427527, "Sobre calle San Luis a metros de la esquina con calle 10 de Octubre", "Poste de madera, con baldosas rotas alrededor"],
  [18, 61, 73, -24.800468265579298, -65.39743272552272, "Sobre Av. Hipólito Yrigoyen a metros de la calle Abel Cornejo", "Poste de metal ancho, con dos postes de cemento cerca"],
  [19, 77, 42, -24.75131906652111, -65.40568137156023, "Sobre Av. Constitución Nacional a metros de esquina con calle Juramento", "Dos postes de madera cercanos"],
  [20, 79, 78, -24.7302348436613, -65.41058013120471, "Sobre Av. Bolivia a 15 metros de Av. Houssay", "Poste de cemento, con vereda amplia"],
  [21, 43, 80, -24.754354771445463, -65.39939136955718, "Sobre Av. Bicentenario de la Batalla de Salta Fuera de Club Norte", "Poste de madera al borde de la vereda, con piso de pasto"],
  [22, 43, 81, -24.761713674443406, -65.39701248954982, "Sobre Av. Bicentenario de la Batalla de Salta a metros de calle Los Damascos", "Poste de cemento, con cesto de basura y piso de tierra"],
  [23, 14, 41, -24.78751910319096, -65.40609296414348, "Sobre Av. Belgrano a 20 metros de la esquina", "Poste de metal con cesto de basura integrado."],
  [24, 16, 44, -24.788916632347615, -65.42490838325938, "Sobre calle Caseros, esquina calle Laprida", "Tres postes de madera casi juntos."],
  [25, 82, 16, -24.788184759195506, -65.42746415378691, "Sobre calle Republica de Siria, a las afueras de un paredón de cemento.", "Poste cuadrado de metal ancho, con vereda amplia"]
];

const relaciones = [
  [1, 21],
  [1, 23],
  [1, 25],
  [1, 30],
  [1, 31],
  [2, 4],
  [2, 8],
  [2, 10],
  [2, 11],
  [3, 34],
  [3, 35],
  [3, 38],
  [4, 34],
  [4, 35],
  [4, 38],
  [5, 12],
  [5, 16],
  [6, 2],
  [7, 9],
  [7, 12],
  [7, 46],
  [7, 47],
  [8, 20],
  [8, 21],
  [8, 22],
  [8, 23],
  [8, 24],
  [9, 46],
  [9, 47],
  [9, 49],
  [9, 50],
  [10, 27],
  [10, 29],
  [10, 30],
  [10, 34],
  [10, 35],
  [10, 38],
  [11, 16],
  [11, 27],
  [12, 51],
  [13, 8],
  [13, 14],
  [13, 15],
  [14, 43],
  [14, 44],
  [15, 12],
  [15, 16],
  [16, 46],
  [16, 47],
  [16, 49],
  [16, 50],
  [17, 20],
  [17, 21],
  [18, 9],
  [18, 10],
  [18, 11],
  [18, 14],
  [18, 15],
  [18, 19],
  [18, 51],
  [19, 36],
  [19, 37],
  [19, 41],
  [20, 34],
  [20, 35],
  [20, 38],
  [21, 28],
  [21, 29],
  [21, 30],
  [22, 28],
  [22, 29],
  [22, 30],
  [23, 20],
  [23, 21],
  [23, 22],
  [23, 23],
  [23, 24],
  [23, 36],
  [23, 37],
  [24, 28],
  [24, 29],
  [24, 30],
  [25, 28],
  [25, 29],
  [25, 30]
];

// ============================================
// EJECUCIÓN DE LA SIEMBRA
// ============================================

async function sembrar() {
  const client = await pool.connect();

  try {
    console.log('📐 Creando el esquema (tablas)...');
    const schemaSQL = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf-8');
    await client.query(schemaSQL);
    console.log('✅ Esquema creado.');

    console.log(`🏙️  Insertando ${calles.length} calles...`);
    for (const [id, nombre] of calles) {
      await client.query(
        'INSERT INTO calles (id_calle, nombre) VALUES ($1, $2)',
        [id, nombre]
      );
    }

    console.log(`🚌 Insertando ${lineas.length} líneas...`);
    for (const [id, nombre] of lineas) {
      await client.query(
        'INSERT INTO lineas (id_linea, nombre) VALUES ($1, $2)',
        [id, nombre]
      );
    }

    console.log(`🚏 Insertando ${paradas.length} paradas...`);
    for (const [id, calleP, calleI, lat, lng, desc, acc] of paradas) {
      await client.query(
        `INSERT INTO paradas
         (id_parada, id_calle_principal, id_calle_interseccion, latitud, longitud, descripcion_ubicacion, referencia_accesibilidad)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, calleP, calleI, lat, lng, desc, acc]
      );
    }

    console.log(`🔗 Insertando ${relaciones.length} relaciones parada-línea...`);
    for (const [idParada, idLinea] of relaciones) {
      await client.query(
        'INSERT INTO parada_linea (id_parada, id_linea) VALUES ($1, $2)',
        [idParada, idLinea]
      );
    }

    // Reiniciar los contadores de autoincremento para que sigan
    // desde el número correcto después de estas inserciones manuales
    await client.query(`SELECT setval('calles_id_calle_seq', (SELECT MAX(id_calle) FROM calles))`);
    await client.query(`SELECT setval('lineas_id_linea_seq', (SELECT MAX(id_linea) FROM lineas))`);
    await client.query(`SELECT setval('paradas_id_parada_seq', (SELECT MAX(id_parada) FROM paradas))`);

    console.log('✅ ¡Siembra completa!');
  } catch (error) {
    console.error('❌ Error durante la siembra:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

sembrar();
