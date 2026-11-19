import {AU, DAY, G, MSUN, RSUN} from './physics.js?v=fullaudit2';

const MU = G * MSUN * DAY ** 2 / AU ** 3;
export const earthSpeed = Math.sqrt(MU) * AU / DAY / 1000;
export const targets = {
 Mercury: [.3871, 'Меркурій', 'Mercury', 'Mercurio', 'Mercurio'],
 Venus: [.7233, 'Венера', 'Venus', 'Venere', 'Venus'],
 Mars: [1.5237, 'Марс', 'Mars', 'Marte', 'Marte'],
 Jupiter: [5.2029, 'Юпітер', 'Jupiter', 'Giove', 'Júpiter'],
 Saturn: [9.5367, 'Сатурн', 'Saturn', 'Saturno', 'Saturno'],
 Uranus: [19.1892, 'Уран', 'Uranus', 'Urano', 'Urano'],
 Neptune: [30.0699, 'Нептун', 'Neptune', 'Nettuno', 'Neptuno'],
 Pluto: [39.4821, 'Плутон', 'Pluto', 'Plutone', 'Plutón']
};
export const angle = radians => Math.atan2(Math.sin(radians), Math.cos(radians));
export const circularRate = radius => Math.sqrt(MU / radius ** 3);
export const hohmannRatio = radius => Math.sqrt(2 * radius / (1 + radius));

// The ship starts at an apsis with a tangential heliocentric velocity.
export function transfer(radius, speedRatio, phase) {
 const a = 1 / (2 - speedRatio ** 2);
 const outward = speedRatio >= 1;
 const sign = outward ? 1 : -1;
 const e = Math.abs(speedRatio ** 2 - 1);
 const minor = Math.sqrt(1 - e * e);
 const start = outward ? 0 : Math.PI;
 const rate = circularRate(a);
 const oppositeRadius = 2 * a - 1;
 const reaches = e > 0 && radius >= Math.min(1, oppositeRadius) - 1e-10 &&
  radius <= Math.max(1, oppositeRadius) + 1e-10;
 const cosine = reaches ? Math.max(-1, Math.min(1, (1 - radius / a) / e)) : -1;
 const end = reaches ? (outward ? Math.acos(cosine) : 2 * Math.PI - Math.acos(cosine)) : start + Math.PI;
 const duration = (end - e * Math.sin(end) - start) / rate;
 const atAnomaly = anomaly => {
  const x = sign * a * (Math.cos(anomaly) - e);
  const y = sign * a * minor * Math.sin(anomaly);
  const factor = sign * a * rate / (1 - e * Math.cos(anomaly)) * AU / DAY / 1000;
  return {x, y, vx: -factor * Math.sin(anomaly), vy: factor * minor * Math.cos(anomaly)};
 };
 const position = days => {
  const mean = start + rate * days;
  let lo = start, hi = end;
  for (let i = 0; i < 40; i++) {
   const mid = (lo + hi) / 2;
   if (mid - e * Math.sin(mid) < mean) lo = mid;
   else hi = mid;
  }
  return atAnomaly((lo + hi) / 2);
 };
 const arrival = atAnomaly(end);
 const aim = angle(Math.atan2(arrival.y, arrival.x) - circularRate(radius) * duration);
 const arrivalPhase = phase + circularRate(radius) * duration;
 const targetSpeed = earthSpeed / Math.sqrt(radius);
 return {
  position, atAnomaly, start, end, duration, reaches, oppositeRadius, aim,
  vx:0, vy:speedRatio * earthSpeed,
  deltaV: Math.abs(speedRatio - 1) * earthSpeed,
  miss: Math.hypot(arrival.x - radius * Math.cos(arrivalPhase), arrival.y - radius * Math.sin(arrivalPhase)),
  relativeSpeed: Math.hypot(arrival.vx + targetSpeed * Math.sin(arrivalPhase), arrival.vy - targetSpeed * Math.cos(arrivalPhase)),
 };
}

// Body-frame hyperbola and velocity vectors at infinity (km, s).
export const assistBodies = {
 Earth: { radius: 6371, mu: 398600, orbit: 1 },
 Venus: { radius: 6052, mu: 324859, orbit: .7233 },
 Jupiter: { radius: 71492, mu: 126686534, orbit: 5.2029 },
};
export function flyby(body, altitude, excess, side) {
 const periapsis = body.radius + altitude;
 const eccentricity = 1 + periapsis * excess ** 2 / body.mu;
 const limit = Math.acos(-1 / eccentricity);
 const turn = 2 * Math.asin(1 / eccentricity);
 const orbitalSpeed = earthSpeed / Math.sqrt(body.orbit);
 const direction = side * turn;
 const incoming = [excess, orbitalSpeed];
 const outgoing = [excess * Math.cos(direction), orbitalSpeed + excess * Math.sin(direction)];
 return {periapsis, eccentricity, limit, turn, incoming, outgoing, orbitalSpeed,
  change: Math.hypot(...outgoing) - Math.hypot(...incoming)};
}

// An ideal tangential departure from a 200 km Earth parking orbit.
// Velocity components are heliocentric, expressed along the radial and prograde axes.
export function departureCost(vx, vy) {
 const excess = Math.hypot(vx, vy - earthSpeed);
 const parkingSpeedSquared = assistBodies.Earth.mu / (assistBodies.Earth.radius + 200);
 return {
  excess,
  burn: Math.sqrt(2 * parkingSpeedSquared + excess ** 2) - Math.sqrt(parkingSpeedSquared),
  energy: (parkingSpeedSquared + excess ** 2) / 2, // 1 km²/s² = 1 MJ/kg
 };
}

export const fastRatio = radius => Math.min(1.405, Math.max(.54, 1 + (hohmannRatio(radius) - 1) * 1.35));

// Point the heliocentric velocity at the target's current position, then coast.
// Orient the ellipse by its eccentricity vector and advance using Kepler's equation.
export function directTransfer(radius, speedRatio, phase) {
 const target = [radius * Math.cos(phase), radius * Math.sin(phase)];
 const distance = Math.hypot(target[0] - 1, target[1]);
 const vx = speedRatio * (target[0] - 1) / distance;
 const vy = speedRatio * target[1] / distance;
 const a = 1 / (2 - speedRatio ** 2);
 const orientation = vy < 0 ? -1 : 1;
 const ex = vy ** 2 - 1, ey = -vx * vy;
 const e = Math.min(1, Math.hypot(ex, ey));
 const omega = Math.atan2(ey, ex);
 const minor = Math.abs(vy) / Math.sqrt(a);
 const rate = circularRate(a);
 const start = Math.atan2(vx / Math.sqrt(a), 1 - 1 / a);
 const initialMean = start - e * Math.sin(start);
 const straightDuration = distance / (speedRatio * circularRate(1));
 const solarRadius = RSUN / AU;
 let duration = straightDuration;
 if (a * (1 - e) < solarRadius) {
  const entry = -Math.acos((1 - solarRadius / a) / e);
  const nextEntry = entry + 2 * Math.PI * Math.ceil((start - entry) / (2 * Math.PI));
  duration = Math.min(duration, (nextEntry - e * Math.sin(nextEntry) - initialMean) / rate);
 }
 const position = days => {
  const mean = initialMean + rate * days;
  let lo = mean - e, hi = mean + e;
  for (let i = 0; i < 48; i++) {
   const mid = (lo + hi) / 2;
   if (mid - e * Math.sin(mid) < mean) lo = mid;
   else hi = mid;
  }
  const eccentricAnomaly = (lo + hi) / 2;
  const px = a * (Math.cos(eccentricAnomaly) - e);
  const py = orientation * a * minor * Math.sin(eccentricAnomaly);
  return {x:px * Math.cos(omega) - py * Math.sin(omega), y:px * Math.sin(omega) + py * Math.cos(omega)};
 };
 const arrival = position(duration);
 const targetPhase = phase + circularRate(radius) * duration;
 return {
  position, duration, straightDuration, target, collided: duration < straightDuration,
  vx:vx * earthSpeed, vy:vy * earthSpeed,
  miss:Math.hypot(arrival.x - radius * Math.cos(targetPhase), arrival.y - radius * Math.sin(targetPhase)),
 };
}
