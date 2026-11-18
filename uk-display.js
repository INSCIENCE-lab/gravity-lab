const superscript = '⁻⁰¹²³⁴⁵⁶⁷⁸⁹';
const units = {
  m:'м', km:'км', kg:'кг', N:'Н', J:'Дж', s:'с', ns:'нс', ms:'мс', 'μs':'мкс',
  AU:'а. о.', SI:'СІ', day:'діб', rad:'рад', 'N·s':'Н·с', 'm/s':'м/с', 'm/s²':'м/с²', 'km/s':'км/с',
  'J/kg':'Дж/кг', 'm⁻⁴':'м⁻⁴', 'W':'Вт', 'Hz':'Гц',
};
export const unitLabel = (unit, lang) => lang === 'uk' ? units[unit] ?? unit : unit;

const dayRules = new Intl.PluralRules('uk-UA');
const dayForms = {one:'доба', few:'доби', many:'діб', other:'доби'};
export function dayWord(days, lang, digits, long = false) {
  if (lang !== 'uk') return long ? days === 1 ? 'day' : 'days' : 'd';
  return dayForms[dayRules.select(Number(days.toFixed(digits)))];
}

export function scientificNumber(value, digits, locale) {
  const [mantissa, exponent] = value.toExponential(digits).split('e');
  const separator = Intl.NumberFormat(locale).formatToParts(1.1).find(part => part.type === 'decimal').value;
  const power = String(Number(exponent)).replace(/[-0-9]/g, c => superscript['-0123456789'.indexOf(c)]);
  return mantissa.replace('.', separator) + ' × 10' + power;
}

const measure = /(^|\s|\()([+-]?\d+(?:[.,]\d+)?(?:[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)?)(\s*)(km\/s|m\/s²|m\/s|J\/kg|m⁻⁴|kg|km|AU|μs|ns|ms|SI|Hz|W|N|J|m|s)(?![\p{L}\p{N}_/])/gu;
export function ukrainianText(text) {
  return text
    .replace(measure, (_, start, number, space, unit) => start + number.replace('.', ',') + (space || ' ') + units[unit])
    .replace(/(^|\s)(SI|AU)(?![\p{L}\p{N}_])/gu, (_, start, unit) => start + units[unit])
    .replace(/^(\s+)(km\/s|m\/s²|m\/s|J\/kg|m⁻⁴|kg|km|AU|N|J|m|s)(?=\s*(?:$|[.;,)·]))/u, (_, space, unit) => space + units[unit])
    .replace(/(\d)\.(\d+)(?=\s*(?:×|M☉))/g, '$1,$2');
}

const journal = {
  time_s:'Час, с', time_rg:'Час у масштабі r_g/c', proper_s:'Власний час, с',
  reference_s:'Еталонний час, с', lost_s:'Відставання, с', rate:'Темп годинника, dτ/dt',
  rate_deficit:'Відносне сповільнення годинника', height_m:'Висота, м',
  reference_radius_m:'Радіус початку відліку, м', height_reference:'Рівень відліку висоти',
  radius_m:'Радіус, м', r_rg:'Радіус у масштабі r_g', rs_m:'Радіус Шварцшильда, м', r_over_rs:'Радіус у масштабі r_s',
  exact_height_m:'Точна висота стрибка, м', max_height_m:'Максимальна висота, м',
  initial_height_m:'Початкова висота, м', range_m:'Дальність польоту, м',
  x_m:'Координата x, м', y_m:'Координата y, м', z_m:'Координата z, м',
  cube_probe_x_m:'Координата пробної точки x, м', cube_probe_y_m:'Координата пробної точки y, м', cube_probe_z_m:'Координата пробної точки z, м',
  cube_probe_static_rate:'Темп нерухомого годинника в пробній точці, dτ/dt', cube_probe_valid:'Нерухомий годинник у пробній точці можливий',
  cube_length_x_factor:'Масштаб довжини вздовж x', cube_length_y_factor:'Масштаб довжини вздовж y', cube_length_z_factor:'Масштаб довжини вздовж z',
  cube_volume_factor:'Множник об’єму', cube_visual_gain:'Підсилення вигину сітки', cube_display_mode:'Вигляд куба',
  cube_grid_unit_m:'Одиниця сітки куба, м', cube_half_extent_m:'Половина ребра куба, м',
  grid_unit_m:'Одиниця сітки, м', grid_outer_m:'Зовнішня межа сітки, м', grid_scale_mode:'Режим масштабу сітки',
  impact_rg:'Прицільний параметр у масштабі r_g', impact_m:'Прицільний параметр, м',
  closest_rg:'Найменший радіус у масштабі r_g', closest_m:'Найменший радіус, м',
  deflection_rad:'Кут відхилення, рад', deflection_deg:'Кут відхилення, °', ray_status:'Стан променя',
  null_constraint_error:'Похибка умови нульової геодезичної',
  mass_kg:'Маса, кг', mass_solar:'Маса в одиницях M☉', m1_solar:'Маса першого тіла в одиницях M☉', m2_solar:'Маса другого тіла в одиницях M☉',
  g_ms2:'Прискорення вільного падіння, м/с²', gravity_ms2:'Прискорення вільного падіння, м/с²',
  net_acceleration_ms2:'Рівнодійне прискорення, м/с²', hover_acceleration_ms2:'Прискорення для утримання на місці, м/с²',
  force_N:'Сила тяжіння, Н', support_N:'Реакція опори, Н', weight_N:'Вага на опорі, Н',
  mean_net_force_N:'Середня рівнодійна сила, Н', gravity_force_N:'Сила тяжіння, Н',
  speed_ms:'Швидкість, м/с', speed_c:'Швидкість у частках c', initial_speed_ms:'Початкова швидкість, м/с',
  v0_ms:'Початкова швидкість, м/с', vx_ms:'Швидкість вздовж x, м/с', vy_ms:'Швидкість вздовж y, м/с', escape_ms:'Швидкість втечі, м/с',
  energy_J:'Енергія, Дж', kinetic_J:'Кінетична енергія, Дж', potential_J:'Потенціальна енергія, Дж', total_J:'Повна енергія, Дж',
  energy_specific_Jkg:'Питома енергія, Дж/кг', energy_residual:'Відхилення енергетичного інтеграла',
  angular_residual:'Відхилення інтеграла моменту імпульсу', pn_parameter:'Параметр постньютонівського наближення',
  launch_mode:'Спосіб кидка', launch_angle_deg:'Кут кидка, °', push_duration_s:'Тривалість поштовху, с',
  flight_s:'Час польоту, с', flight_time_s:'Час польоту, с', period_circular_s:'Період колової орбіти, с',
  body:'Об’єкт', planet:'Планета', valid:'Допустимий вимір', observer:'Спостерігач', reason:'Причина',
  barycenter_shift_m:'Зміщення центра мас, м', barycenter_x_m:'Координата центра мас x, м',
  energy_invariant:'Енергетичний інтеграл', angular_invariant:'Інтеграл моменту імпульсу', constraint_error:'Похибка умови нормування',
  satellite_area_m2:'Площа перерізу, м²', drag_multiplier:'Множник атмосферної густини', orbit_turns:'Кількість обертів', inclination_deg:'Нахил орбіти, °', ascending_node_deg:'Довгота висхідного вузла, °', atmosphere_model:'Модель середовища',
  perigee_m:'Перигей, м', apogee_m:'Апогей, м', satellite_duration_s:'Тривалість прогону, с', satellite_outcome:'Результат прогону',
  curvature_m4:'Інваріант кривини, м⁻⁴', scale_m:'Масштаб, м',
};
export function journalLabel(key, lang) {
  if (lang !== 'uk') return key;
  return journal[key] ?? key;
}
