-- Seed Data for Moodlink
-- Optional: Run this after the initial schema migration to populate sample data

-- ============================================
-- SAMPLE AI RESPONSES
-- ============================================
-- Insert some default AI responses for different mood categories

INSERT INTO ai_responses (mood_category, mood_range_start, mood_range_end, message) VALUES
-- Very Low Moods (1-3)
('very_low', 1, 3, 'It''s okay to not be okay. You''re not alone in this. Consider reaching out to someone you trust, or try some gentle self-care activities. Remember, this feeling will pass.'),
('very_low', 1, 3, 'Your feelings are valid. Sometimes the hardest part is just getting through the day, and you''re doing it. Be gentle with yourself today.'),
('very_low', 1, 3, 'I see you''re going through a tough time. Even small steps forward count. Consider what might help you feel even a tiny bit better right now.'),

-- Low Moods (4-5)
('low', 4, 5, 'It sounds like things are feeling heavy right now. Remember that it''s okay to take things one moment at a time. What''s one small thing that might help?'),
('low', 4, 5, 'You''re navigating through some difficult feelings. Consider doing something kind for yourself today, even if it''s small.'),
('low', 4, 5, 'These feelings won''t last forever. Sometimes acknowledging them is the first step toward feeling better.'),

-- Neutral Moods (6-7)
('neutral', 6, 7, 'You''re in a balanced space today. This can be a good time for reflection or trying something new.'),
('neutral', 6, 7, 'A steady day can be a gift. Consider what might bring you a bit of joy or connection.'),
('neutral', 6, 7, 'You''re in a calm space. This might be a good time to check in with yourself about what you need.'),

-- Positive Moods (8-9)
('positive', 8, 9, 'It''s wonderful to see you''re feeling good! Consider sharing this positive energy or doing something that brings you joy.'),
('positive', 8, 9, 'You''re in a great space today! This is a perfect time to connect with others or pursue something meaningful.'),
('positive', 8, 9, 'Your positive mood is shining through! Consider what''s contributing to this and how you can nurture it.'),

-- Very Positive Moods (10)
('very_positive', 10, 10, 'You''re radiating positivity! This is a beautiful moment. Consider spreading this joy or capturing it in some way.'),
('very_positive', 10, 10, 'What an amazing feeling! Celebrate this moment and consider what made it special.'),
('very_positive', 10, 10, 'You''re on top of the world! This is a perfect time to connect with others or do something you love.')

ON CONFLICT DO NOTHING;

-- ============================================
-- HELPER FUNCTION: Get AI Response by Mood
-- ============================================
CREATE OR REPLACE FUNCTION get_ai_response_by_mood(mood_val INTEGER)
RETURNS TABLE (
    id UUID,
    message TEXT,
    mood_category TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ar.id,
        ar.message,
        ar.mood_category
    FROM ai_responses ar
    WHERE mood_val >= ar.mood_range_start 
      AND mood_val <= ar.mood_range_end
    ORDER BY RANDOM()
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- USAGE
-- ============================================
-- To get a random AI response for a mood value (e.g., 7):
-- SELECT * FROM get_ai_response_by_mood(7);
