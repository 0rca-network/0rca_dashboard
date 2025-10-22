-- Sample DAO data for testing

-- Sample proposals
INSERT INTO dao_proposals (
  id,
  creator_id,
  title,
  description,
  proposal_type,
  voting_starts_at,
  voting_ends_at,
  status,
  votes_for,
  votes_against,
  votes_abstain,
  quorum_required
) VALUES 
(
  gen_random_uuid(),
  (SELECT id FROM profiles LIMIT 1),
  'Reduce Platform Fee from 10% to 8%',
  'Proposal to reduce the platform fee charged to creators from 10% to 8% to increase competitiveness and attract more agent creators to the platform.',
  'fee_change',
  NOW() - INTERVAL '2 days',
  NOW() + INTERVAL '5 days',
  'active',
  750000,
  250000,
  50000,
  1000000
),
(
  gen_random_uuid(),
  (SELECT id FROM profiles LIMIT 1),
  'Allocate $500K for Agent Creator Incentives',
  'Allocate $500,000 from treasury to create an incentive program for high-performing agent creators, including performance bonuses and development grants.',
  'treasury',
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '6 days',
  'active',
  1200000,
  300000,
  100000,
  1000000
),
(
  gen_random_uuid(),
  (SELECT id FROM profiles LIMIT 1),
  'Implement Agent Quality Scoring System',
  'Introduce a community-driven quality scoring system for agents based on performance metrics, user feedback, and reliability scores.',
  'feature',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '3 days',
  'passed',
  1800000,
  200000,
  150000,
  1000000
),
(
  gen_random_uuid(),
  (SELECT id FROM profiles LIMIT 1),
  'Add AI Vision Category to Marketplace',
  'Add a new "AI Vision" category to the agent marketplace for computer vision and image processing agents.',
  'agent_curation',
  NOW() - INTERVAL '15 days',
  NOW() - INTERVAL '8 days',
  'executed',
  1500000,
  400000,
  100000,
  1000000
);

-- Sample treasury transactions
INSERT INTO dao_treasury (
  transaction_type,
  amount,
  description,
  status
) VALUES 
('revenue', 125000.00, 'Monthly platform fees collected', 'executed'),
('expense', 45000.00, 'Development team salaries', 'executed'),
('expense', 15000.00, 'Infrastructure and hosting costs', 'executed'),
('distribution', 25000.00, 'Token holder rewards distribution', 'executed'),
('grant', 50000.00, 'Community development grant', 'pending');