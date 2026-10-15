const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Rota para buscar todos os gatos
app.get('/gatos', async (req, res) => {
    try {
        const { data, error } = await supabase.from('gatos').select('*');
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

// Rota para cadastrar um novo gato
app.post('/gatos', upload.single('foto'), async (req, res) => {
    try {
        const { 
            nome, idade_aproximada, pelagem, sexo, status, 
            fiv_felv, castrado, vermifugado, despulgado, vacinado, 
            observacoes_medicas, data_vermifugo_1, data_vermifugo_2 
        } = req.body;

        let fotoUrl = null;
        if (req.file) {
            const nomeArquivo = `${Date.now()}-${req.file.originalname}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('fotos-gatos')
                .upload(nomeArquivo, req.file.buffer, { contentType: req.file.mimetype });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('fotos-gatos')
                .getPublicUrl(nomeArquivo);

            fotoUrl = urlData.publicUrl;
        }

        const { error } = await supabase.from('gatos').insert([{
            nome,
            idade_aproximada,
            pelagem,
            sexo,
            status,
            fiv_felv: fiv_felv || 'Não testado',
            castrado: castrado === 'true' || castrado === true,
            vermifugado: vermifugado === 'true' || vermifugado === true,
            despulgado: despulgado === 'true' || despulgado === true,
            vacinado: vacinado === 'true' || vacinado === true,
            observacoes_medicas: observacoes_medicas || '',
            data_vermifugo_1: data_vermifugo_1 || null,
            data_vermifugo_2: data_vermifugo_2 || null,
            foto: fotoUrl
        }]);

        if (error) throw error;
        res.status(201).json({ mensagem: 'Gatinho cadastrado com sucesso!' });
    } catch (err) {
        console.error("Erro no POST /gatos:", err.message);
        res.status(500).json({ erro: err.message });
    }
});

// Rota para atualizar os dados de um gato
app.put('/gatos/:nome', upload.single('foto'), async (req, res) => {
    try {
        const nomeAntigo = req.params.nome;
        const { 
            nome, idade_aproximada, pelagem, sexo, status, 
            fiv_felv, castrado, vermifugado, despulgado, vacinado, 
            observacoes_medicas, data_vermifugo_1, data_vermifugo_2 
        } = req.body;

        let dadosAtualizados = {
            nome,
            idade_aproximada,
            pelagem,
            sexo,
            status,
            fiv_felv: fiv_felv || 'Não testado',
            castrado: castrado === 'true' || castrado === true,
            vermifugado: vermifugado === 'true' || vermifugado === true,
            despulgado: despulgado === 'true' || despulgado === true,
            vacinado: vacinado === 'true' || vacinado === true,
            observacoes_medicas: observacoes_medicas || '',
            data_vermifugo_1: data_vermifugo_1 || null,
            data_vermifugo_2: data_vermifugo_2 || null
        };

        if (req.file) {
            const nomeArquivo = `${Date.now()}-${req.file.originalname}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('fotos-gatos')
                .upload(nomeArquivo, req.file.buffer, { contentType: req.file.mimetype });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('fotos-gatos')
                .getPublicUrl(nomeArquivo);

            dadosAtualizados.foto = urlData.publicUrl;
        }

        const { error } = await supabase
            .from('gatos')
            .update(dadosAtualizados)
            .eq('nome', nomeAntigo);

        if (error) throw error;
        res.json({ mensagem: 'Gatinho atualizado com sucesso!' });
    } catch (err) {
        console.error("Erro no PUT /gatos:", err.message);
        res.status(500).json({ erro: err.message });
    }
});

// Rota para excluir um gato
app.delete('/gatos/:nome', async (req, res) => {
    try {
        const nomeGato = req.params.nome;
        const { error } = await supabase.from('gatos').delete().eq('nome', nomeGato);
        if (error) throw error;
        res.json({ mensagem: 'Gatinho excluído com sucesso!' });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

// --- ROTAS DE GASTOS ---

// Rota para buscar os gastos de um gatinho
app.get('/gastos/:nome', async (req, res) => {
    try {
        const nomeGato = req.params.nome;
        const { data, error } = await supabase
            .from('gastos')
            .select('*')
            .eq('nome_gato', nomeGato);

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

// Rota para adicionar um gasto a um gatinho
app.post('/gastos', async (req, res) => {
    try {
        const { nome_gato, descricao, valor, data } = req.body;
        const { error } = await supabase.from('gastos').insert([{
            nome_gato,
            descricao,
            valor: parseFloat(valor),
            data: data || new Date().toISOString().split('T')[0]
        }]);

        if (error) throw error;
        res.status(201).json({ mensagem: 'Gasto registado com sucesso!' });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

// Rota para excluir um gasto específico
app.delete('/gastos/:id', async (req, res) => {
    try {
        const idGasto = req.params.id;
        const { error } = await supabase.from('gastos').delete().eq('id', idGasto);
        if (error) throw error;
        res.json({ mensagem: 'Gasto excluído com sucesso!' });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor a rodar na porta ${PORT}`);
});