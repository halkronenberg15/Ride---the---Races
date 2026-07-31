import type { Rider } from './rider'
import { halRider } from './rider'

export type Team = {
  name: string
  country: string
  riders: Rider[]
}

export const teamLoriot: Team = {
  name: 'Team Loriot',
  country: 'United States',
  riders: [
    halRider,
    {
      name: 'Jean Moreau',
      age: 31,
      team: 'Team Loriot',
      endurance: 82,
      sprint: 61,
      climbing: 76,
      timeTrial: 72,
      raceIQ: 86,
      energy: 100,
    },
    {
      name: 'Marco Bellini',
      age: 28,
      team: 'Team Loriot',
      endurance: 74,
      sprint: 88,
      climbing: 55,
      timeTrial: 67,
      raceIQ: 73,
      energy: 100,
    },
    {
      name: 'Lukas Weber',
      age: 30,
      team: 'Team Loriot',
      endurance: 79,
      sprint: 58,
      climbing: 84,
      timeTrial: 70,
      raceIQ: 78,
      energy: 100,
    },
    {
      name: 'Tomás Rivera',
      age: 26,
      team: 'Team Loriot',
      endurance: 76,
      sprint: 74,
      climbing: 69,
      timeTrial: 65,
      raceIQ: 71,
      energy: 100,
    },
    {
      name: 'Elias Nord',
      age: 29,
      team: 'Team Loriot',
      endurance: 81,
      sprint: 57,
      climbing: 73,
      timeTrial: 83,
      raceIQ: 80,
      energy: 100,
    },
    {
      name: 'Nathan Cole',
      age: 24,
      team: 'Team Loriot',
      endurance: 68,
      sprint: 79,
      climbing: 62,
      timeTrial: 64,
      raceIQ: 66,
      energy: 100,
    },
    {
      name: 'Victor Laurent',
      age: 33,
      team: 'Team Loriot',
      endurance: 85,
      sprint: 54,
      climbing: 78,
      timeTrial: 75,
      raceIQ: 89,
      energy: 100,
    },
  ],
}