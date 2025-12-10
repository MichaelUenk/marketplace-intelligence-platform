import React, { useState, useEffect } from 'react';
import type { OutreachSequence } from '../../types/outreach';
import { DEFAULT_SEQUENCE_SETTINGS } from '../../constants/outreach';
import SequenceList from './SequenceList';
import SequenceBuilder from './SequenceBuilder';
import { api } from '../../services/api';
import type { OutreachSequence as DbSequence } from '../../types/database';

// Demo sequences for initial state (fallback)
const createDemoSequences = (): OutreachSequence[] => [
  {
    id: 'demo-1',
    name: 'Enterprise Tech Outreach Q1',
    description: 'Multi-channel sequence targeting Tier 1 tech companies in Europe',
    status: 'active',
    targeting: {
      audience_type: 'dynamic',
      filters: {
        industries: ['Technology', 'Software'],
        company_sizes: ['1000+'],
        regions: ['Europe'],
      },
      exclusions: {
        exclude_existing_sequences: true,
        exclude_replied: true,
        exclude_bounced: true,
        exclude_unsubscribed: true,
        exclude_company_ids: [],
        exclude_contact_ids: [],
      },
    },
    steps: [
      {
        id: 's1',
        sequence_id: 'demo-1',
        order: 1,
        type: 'message',
        channel: 'email',
        content: {
          subject: 'Quick question about {{company.name}}\'s sustainability goals',
          body: 'Hi {{contact.first_name}},\n\nI noticed {{company.name}} recently announced some impressive sustainability initiatives. We\'ve helped similar companies reduce their plastic waste by 90% while cutting beverage costs.\n\nWould you be open to a quick call to explore if this could work for you?\n\nBest,\n{{sender.first_name}}',
          tokens_used: ['contact.first_name', 'company.name', 'sender.first_name'],
        },
        stats: {
          sent: 847,
          delivered: 832,
          opened: 289,
          clicked: 35,
          replied: 18,
          bounced: 15,
          open_rate: 34.2,
          click_rate: 4.1,
          reply_rate: 2.1,
        },
      },
      {
        id: 's2',
        sequence_id: 'demo-1',
        order: 2,
        type: 'wait',
        wait: { type: 'business_days', business_days: 3 },
      },
      {
        id: 's3',
        sequence_id: 'demo-1',
        order: 3,
        type: 'message',
        channel: 'li_invite',
        content: {
          body: 'Hi {{contact.first_name}}, I reached out via email about workplace hydration solutions. Would love to connect here as well!',
          tokens_used: ['contact.first_name'],
        },
        stats: {
          sent: 732,
          delivered: 732,
          opened: 0,
          clicked: 0,
          replied: 208,
          bounced: 0,
          open_rate: 0,
          click_rate: 0,
          reply_rate: 28.4,
        },
      },
      {
        id: 's4',
        sequence_id: 'demo-1',
        order: 4,
        type: 'wait',
        wait: { type: 'business_days', business_days: 2 },
      },
      {
        id: 's5',
        sequence_id: 'demo-1',
        order: 5,
        type: 'message',
        channel: 'li_chat',
        content: {
          body: 'Thanks for connecting, {{contact.first_name}}! I saw your team at {{company.name}} is growing - congrats! Quick question: how are you currently handling employee refreshments? We\'ve got some interesting data on cost savings I\'d love to share.',
          tokens_used: ['contact.first_name', 'company.name'],
        },
        stats: {
          sent: 412,
          delivered: 412,
          opened: 368,
          clicked: 0,
          replied: 51,
          bounced: 0,
          open_rate: 89.2,
          click_rate: 0,
          reply_rate: 12.3,
        },
      },
      {
        id: 's6',
        sequence_id: 'demo-1',
        order: 6,
        type: 'wait',
        wait: { type: 'business_days', business_days: 3 },
      },
      {
        id: 's7',
        sequence_id: 'demo-1',
        order: 7,
        type: 'message',
        channel: 'email',
        content: {
          subject: 'Following up - {{company.name}}',
          body: 'Hi {{contact.first_name}},\n\nJust a quick follow-up on my previous message. I understand you\'re busy - just wanted to share that we helped [similar company] save over 40% on their beverage costs while eliminating 50,000 plastic bottles annually.\n\nWorth a 15-minute call?\n\n{{sender.first_name}}',
          tokens_used: ['contact.first_name', 'company.name', 'sender.first_name'],
        },
        stats: {
          sent: 298,
          delivered: 292,
          opened: 123,
          clicked: 18,
          replied: 12,
          bounced: 6,
          open_rate: 41.2,
          click_rate: 6.2,
          reply_rate: 4.1,
        },
      },
    ],
    settings: DEFAULT_SEQUENCE_SETTINGS,
    stats: {
      total_enrolled: 847,
      active: 312,
      completed: 187,
      replied: 67,
      bounced: 21,
      unsubscribed: 8,
      open_rate: 34.2,
      click_rate: 4.1,
      reply_rate: 7.9,
      conversion_rate: 2.7,
      step_stats: [],
    },
    created_by: 'user-1',
    team_id: 'team-1',
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-03-01'),
    activated_at: new Date('2024-01-20'),
  },
  {
    id: 'demo-2',
    name: 'Event Follow-up - Sustainability Summit',
    description: 'Post-event outreach for contacts met at the Amsterdam Sustainability Summit',
    status: 'paused',
    targeting: {
      audience_type: 'segment',
      segment_id: 'sustainability-summit-2024',
      exclusions: {
        exclude_existing_sequences: true,
        exclude_replied: true,
        exclude_bounced: true,
        exclude_unsubscribed: true,
        exclude_company_ids: [],
        exclude_contact_ids: [],
      },
    },
    steps: [
      {
        id: 'e1',
        sequence_id: 'demo-2',
        order: 1,
        type: 'message',
        channel: 'email',
        content: {
          subject: 'Great meeting you at the Sustainability Summit!',
          body: 'Hi {{contact.first_name}},\n\nIt was great connecting at the Sustainability Summit last week. I really enjoyed our conversation about {{company.name}}\'s environmental initiatives.\n\nAs discussed, I wanted to share some information about how smart hydration solutions can support your sustainability goals...',
          tokens_used: ['contact.first_name', 'company.name'],
        },
        stats: {
          sent: 156,
          delivered: 154,
          opened: 89,
          clicked: 24,
          replied: 18,
          bounced: 2,
          open_rate: 57.1,
          click_rate: 15.4,
          reply_rate: 11.5,
        },
      },
      {
        id: 'e2',
        sequence_id: 'demo-2',
        order: 2,
        type: 'wait',
        wait: { type: 'business_days', business_days: 2 },
      },
      {
        id: 'e3',
        sequence_id: 'demo-2',
        order: 3,
        type: 'message',
        channel: 'li_invite',
        content: {
          body: 'Hi {{contact.first_name}}, we met at the Sustainability Summit - great discussion! Would love to stay connected.',
          tokens_used: ['contact.first_name'],
        },
      },
    ],
    settings: DEFAULT_SEQUENCE_SETTINGS,
    stats: {
      total_enrolled: 156,
      active: 0,
      completed: 89,
      replied: 34,
      bounced: 2,
      unsubscribed: 1,
      open_rate: 57.1,
      click_rate: 15.4,
      reply_rate: 21.8,
      conversion_rate: 8.3,
      step_stats: [],
    },
    created_by: 'user-1',
    team_id: 'team-1',
    created_at: new Date('2024-02-10'),
    updated_at: new Date('2024-02-25'),
    activated_at: new Date('2024-02-12'),
  },
  {
    id: 'demo-3',
    name: 'Hospitality Vertical - Hotels',
    description: 'Targeted outreach for hotel chains and hospitality groups',
    status: 'draft',
    targeting: {
      audience_type: 'dynamic',
      filters: {
        industries: ['Hospitality', 'Hotels'],
        buyer_personas: ['Hospitality Henry'],
      },
      exclusions: {
        exclude_existing_sequences: true,
        exclude_replied: true,
        exclude_bounced: true,
        exclude_unsubscribed: true,
        exclude_company_ids: [],
        exclude_contact_ids: [],
      },
    },
    steps: [
      {
        id: 'h1',
        sequence_id: 'demo-3',
        order: 1,
        type: 'message',
        channel: 'email',
        content: {
          subject: 'Enhancing guest experience at {{company.name}}',
          body: 'Hi {{contact.first_name}},\n\nGuest experience is everything in hospitality. I wanted to reach out because we\'ve helped hotels like [Hotel Name] significantly improve guest satisfaction scores with our smart hydration solutions...',
          tokens_used: ['contact.first_name', 'company.name'],
        },
      },
      {
        id: 'h2',
        sequence_id: 'demo-3',
        order: 2,
        type: 'wait',
        wait: { type: 'business_days', business_days: 3 },
      },
      {
        id: 'h3',
        sequence_id: 'demo-3',
        order: 3,
        type: 'message',
        channel: 'phone_task',
        content: {
          body: 'Call script:\n\nIntro: "Hi {{contact.first_name}}, this is [Your Name] from iBood. I recently sent an email about enhancing guest experience at {{company.name}}..."\n\nValue prop: "We help hotels eliminate single-use plastic bottles while improving guest satisfaction..."\n\nAsk: "Would you have 15 minutes this week to explore if this could work for your properties?"',
          tokens_used: ['contact.first_name', 'company.name'],
        },
      },
    ],
    settings: DEFAULT_SEQUENCE_SETTINGS,
    stats: {
      total_enrolled: 0,
      active: 0,
      completed: 0,
      replied: 0,
      bounced: 0,
      unsubscribed: 0,
      open_rate: 0,
      click_rate: 0,
      reply_rate: 0,
      conversion_rate: 0,
      step_stats: [],
    },
    created_by: 'user-1',
    team_id: 'team-1',
    created_at: new Date('2024-03-01'),
    updated_at: new Date('2024-03-01'),
  },
];

const OutreachSequences: React.FC = () => {
  const [sequences, setSequences] = useState<OutreachSequence[]>(createDemoSequences());
  const [selectedSequence, setSelectedSequence] = useState<OutreachSequence | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch real sequences from API
  useEffect(() => {
    const fetchSequences = async () => {
      try {
        setLoading(true);
        const apiSequences = await api.getSequences();

        if (apiSequences && apiSequences.length > 0) {
          // Transform API sequences to local type
          const transformedSequences: OutreachSequence[] = apiSequences.map((item) => ({
            id: item.sequence.id,
            name: item.sequence.name,
            description: item.sequence.description || '',
            status: item.sequence.status,
            targeting: {
              audience_type: 'dynamic',
              exclusions: {
                exclude_existing_sequences: true,
                exclude_replied: true,
                exclude_bounced: true,
                exclude_unsubscribed: true,
                exclude_company_ids: [],
                exclude_contact_ids: [],
              },
            },
            steps: [], // Steps would come from detailed sequence fetch
            settings: DEFAULT_SEQUENCE_SETTINGS,
            stats: {
              total_enrolled: item.enrolled_count || 0,
              active: 0,
              completed: 0,
              replied: item.replied_count || 0,
              bounced: 0,
              unsubscribed: 0,
              open_rate: 0,
              click_rate: 0,
              reply_rate: item.reply_rate || 0,
              conversion_rate: item.meetings_count ? (item.meetings_count / (item.enrolled_count || 1)) * 100 : 0,
              step_stats: [],
            },
            created_by: item.created_by || '',
            team_id: '',
            created_at: item.sequence.created_at ? new Date(item.sequence.created_at) : new Date(),
            updated_at: new Date(),
            activated_at: item.sequence.activated_at ? new Date(item.sequence.activated_at) : undefined,
          }));

          setSequences(transformedSequences);
        }
      } catch (err) {
        console.error('Failed to fetch sequences:', err);
        // Keep using demo data on error
      } finally {
        setLoading(false);
      }
    };

    fetchSequences();
  }, []);

  const handleSaveSequence = (sequence: OutreachSequence) => {
    const existingIndex = sequences.findIndex((s) => s.id === sequence.id);
    if (existingIndex >= 0) {
      const updated = [...sequences];
      updated[existingIndex] = { ...sequence, updated_at: new Date() };
      setSequences(updated);
    } else {
      setSequences([...sequences, sequence]);
    }
    setSelectedSequence(null);
  };

  const handleDeleteSequence = (id: string) => {
    setSequences(sequences.filter((s) => s.id !== id));
  };

  const handleCreateSequence = (sequence: OutreachSequence) => {
    setSelectedSequence(sequence);
  };

  if (selectedSequence) {
    return (
      <div style={{ height: 'calc(100vh - 200px)', minHeight: '600px' }}>
        <SequenceBuilder
          sequence={selectedSequence}
          onSave={handleSaveSequence}
          onClose={() => setSelectedSequence(null)}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '0' }}>
      <SequenceList
        sequences={sequences}
        onSelectSequence={setSelectedSequence}
        onCreateSequence={handleCreateSequence}
        onDeleteSequence={handleDeleteSequence}
      />
    </div>
  );
};

export default OutreachSequences;
