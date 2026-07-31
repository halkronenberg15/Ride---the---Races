export type RacePosition =
  | 'Peloton'
  | 'Front Group'
  | 'Breakaway'
  | 'Second Group'

export type RaceChoice = {
  label: string
  energyChange: number
  positionChange: RacePosition
  result: string
}

export type RaceEvent = {
  id: number
  triggerProgress: number
  title: string
  description: string
  choices: RaceChoice[]
}

export const raceEvents: RaceEvent[] = [
  {
    id: 1,
    triggerProgress: 20,
    title: 'Breakaway Forms',
    description:
      'Six riders attack from the front of the peloton. The gap is growing quickly.',
    choices: [
      {
        label: 'Join the breakaway',
        energyChange: -12,
        positionChange: 'Breakaway',
        result:
          'You bridge across and join the breakaway, but the effort costs energy.',
      },
      {
        label: 'Stay in the peloton',
        energyChange: -2,
        positionChange: 'Peloton',
        result:
          'You remain protected in the bunch and conserve energy.',
      },
      {
        label: 'Ask a teammate to chase',
        energyChange: -5,
        positionChange: 'Front Group',
        result:
          'Team Loriot helps control the gap while you move toward the front.',
      },
    ],
  },
  {
    id: 2,
    triggerProgress: 45,
    title: 'Crosswinds Hit',
    description:
      'Strong crosswinds begin splitting the peloton into several groups.',
    choices: [
      {
        label: 'Fight for the front group',
        energyChange: -10,
        positionChange: 'Front Group',
        result:
          'You force your way into the front group and avoid losing time.',
      },
      {
        label: 'Stay behind a teammate',
        energyChange: -4,
        positionChange: 'Peloton',
        result:
          'A teammate shelters you and keeps you safely positioned.',
      },
      {
        label: 'Save energy in the second group',
        energyChange: -1,
        positionChange: 'Second Group',
        result:
          'You conserve energy, but the leading group opens a gap.',
      },
    ],
  },
  {
    id: 3,
    triggerProgress: 70,
    title: 'Final Climb Begins',
    description:
      'The road rises sharply. Riders are beginning to crack under the pace.',
    choices: [
      {
        label: 'Attack immediately',
        energyChange: -15,
        positionChange: 'Breakaway',
        result:
          'You launch a powerful attack and create separation on the climb.',
      },
      {
        label: 'Follow the strongest rider',
        energyChange: -8,
        positionChange: 'Front Group',
        result:
          'You hold the wheel of a strong climber and remain near the leaders.',
      },
      {
        label: 'Ride your own tempo',
        energyChange: -4,
        positionChange: 'Peloton',
        result:
          'You settle into a steady rhythm and avoid burning too much energy.',
      },
    ],
  },
  {
    id: 4,
    triggerProgress: 90,
    title: 'Final Kilometer',
    description:
      'The finish banner appears ahead. The pace surges as every rider fights for position.',
    choices: [
      {
        label: 'Launch the sprint',
        energyChange: -14,
        positionChange: 'Breakaway',
        result:
          'You explode out of the group and charge toward the finish line.',
      },
      {
        label: 'Follow the lead wheel',
        energyChange: -8,
        positionChange: 'Front Group',
        result:
          'You lock onto the fastest wheel and prepare to sprint from the front group.',
      },
      {
        label: 'Finish safely',
        energyChange: -2,
        positionChange: 'Peloton',
        result:
          'You avoid the chaos and ride safely toward the finish inside the peloton.',
      },
    ],
  },
]