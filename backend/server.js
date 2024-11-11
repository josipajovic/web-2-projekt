import { createClient } from '@supabase/supabase-js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';


dotenv.config();
const app = express();
app.use(cors());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

let vulnerabilityEnabled = false;

app.use(express.json());

app.post('/toggle-vulnerability', (req, res) => {
    vulnerabilityEnabled = !vulnerabilityEnabled;
    res.json({ message: `SQL Injection enabled: ${vulnerabilityEnabled}` });
});


app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (vulnerabilityEnabled) {
        (async () => {
            const query = `SELECT to_jsonb(users) FROM users WHERE username = '${username}' AND password = '${password}'`;
            const { data, error } = await supabase.rpc('execute_raw_sql', { query });

            if (error) {
              console.error('Error executing raw SQL:', error);
            } else {
              console.log('Query result:', data);
            }
            res.send(data);
          })();
    } else {
        const { data, error } = supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .then(({ data, error }) => {
            if (error) {
              console.error('Error:', error);
              return;
            }
            console.log('User found:', data);
            if(data.length > 0){
                res.send(`Welcome, ${username}`);
            }
            else{
                res.send("Invalid credentials");
            }
          })
          .catch((err) => {
            console.error('Unexpected error:', err);
          });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
