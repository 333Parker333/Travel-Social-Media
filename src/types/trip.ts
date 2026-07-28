export type TripStatus = 'draft' | 'upcoming' | 'completed' | 'archived';

export type LegType = 'flight' | 'train' | 'bus' | 'stay' | 'activity';

export type Trip = {
  id: string;
  owner: string;
  title: string;
  cover_photo: string | null;
  status: TripStatus;
  shared_with: string[];
  destinations: string[];
  start_date: string | null;
  end_date: string | null;
  total_cost: number;
  created_at: string;
  updated_at: string;
};

export type TripTraveler = {
  id: string;
  trip_id: string;
  user_id: string | null;
  display_name: string;
  created_at: string;
};

export type FlightDetails = {
  airline?: string;
  flight_number?: string;
  seat?: string;
  terminal?: string;
  gate?: string;
};

export type StayDetails = {
  address?: string;
  check_in_time?: string;
  check_out_time?: string;
  room_type?: string;
};

export type ActivityDetails = {
  address?: string;
  booking_reference?: string;
};

export type TransitDetails = {
  carrier?: string;
  number?: string;
  seat?: string;
};

export type LegDetails = FlightDetails | StayDetails | ActivityDetails | TransitDetails;

export type TripLeg = {
  id: string;
  trip_id: string;
  type: LegType;
  position: number;
  start_time: string | null;
  end_time: string | null;
  origin: string | null;
  destination: string | null;
  cost: number;
  confirmation_number: string | null;
  applies_to: string[];
  details: LegDetails;
  created_at: string;
  updated_at: string;
};

export type LegAttachment = {
  id: string;
  leg_id: string;
  file_path: string;
  file_name: string;
  content_type: string | null;
  created_at: string;
};
