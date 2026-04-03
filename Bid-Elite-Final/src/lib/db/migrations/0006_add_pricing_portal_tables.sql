CREATE TABLE packages (
  id uuid PRIMARY key,
  rfq_id uuid references rfqs.id,
  name text not null(),
  description text,
  items jsonb default '[]',
  created_by uuid references users.id;
  created_at timestamp default now() not null,
  updated_at timestamp default now() not null()
);

CREATE TABLE package_invitations_status_enum ('pending', 'viewed', 'submitted', 'revised');
CREATE TABLE package_invitations (
  id uuid primary key,
  package_id uuid references packages.id not null,
  supplier_id uuid references suppliers.id not null,
  auth_code text unique not null;
  share_link text unique;
  sent_at timestamp;
  last_accessed_at timestamp;
  status package_invitation_status_enum not null default 'pending';
  created_at timestamp default now() not null();
);

CREATE TABLE package_submissions (
  id uuid primary key,
  invitation_id uuid references package_invitations.id not null;
  supplier_id uuid references suppliers.id not null;
  package_id uuid references packages.id not null;
  revision integer default 1 not null;
  prices jsonb default '[]';
  total_amount decimal(12,2);
  currency text default 'SAR';
  submitted_at timestamp default now() not null;
  created_at timestamp default now() not null();
