export interface BuildPlate {
  name: string;
  width: number;
  height: number;
  custom?: boolean;
}

export const BUILD_PLATES: BuildPlate[] = [
  { name: 'Bambu Lab H2D', width: 320, height: 325 },
  { name: 'Bambu Lab A1', width: 256, height: 256 },
  { name: 'Bambu Lab A1 Mini', width: 180, height: 180 },
  { name: 'Bambu Lab X1C', width: 256, height: 256 },
  { name: 'Bambu Lab P1S', width: 256, height: 256 },
  { name: 'Custom', width: 200, height: 200, custom: true },
];
