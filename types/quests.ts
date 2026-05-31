export interface Quest {
  id: string;
  type: string;
  target: number;
  rewardXp: number;
  titleEn: string;
  titleFr: string;
}

export interface QuestsData {
  learn: Quest[];
  alphabet: Quest[];
  [category: string]: Quest[];
}
