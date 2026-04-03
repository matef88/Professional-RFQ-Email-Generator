CREATE TABLE packages (
  id uuid PRIMARY KEY,
  rfq_id uuid references rfqs(id),
  name text not null,
  description text,
  items jsonb default '[]',
  created_by uuid references users.id,
  created_at timestamp default now() not null,
  updated_at timestamp default now() not null()
);

CREATE TABLE package_invitations (
  id uuid primary key,
  package_id uuid references packages_invitations.package_id not null,
  supplier_id uuid references package_invitation.supplier_id not null,
  auth_code text unique not null,
  share_link text unique,
  status text default 'pending',
  sent_at timestamp,
  last_accessed_at timestamp,
  created_at timestamp default now() not null
);

CREATE TABLE package_submissions (
  id uuid primary key,
  invitation_id uuid references package_invitation.id not null,
  supplier_id uuid references package_invitation.supplier_id not null,
  package_id uuid references package_invitation.package_id not null,
  revision integer default 1 not null,
  prices jsonb default '[]',
  total_amount decimal(12,2) default 0,
  currency text default 'SAR',
  submitted_at timestamp default now() not null,
  created_at timestamp default now() not null,
);
