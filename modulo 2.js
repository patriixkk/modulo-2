let {
    contas,
    saques,
    depositos,
    transferencias,
    geradorDeNumero,
} = require("../bancodedados/bancodedados");

const date = new Date();
const formattedDate = date.getDay(date, 'dddd, D de MMMM de YYYY', 'pt-BR')

const listarContas = (req, res) => {
    const { senha_banco } = req.query;

    if (!senha_banco) {
        return res.status(401).json({
            mensagem: "Por favor informe a senha de administrador.",
        });
    }

    if (senha_banco !== "Cubos123Bank") {
        return res.status(200).json({
            mensagem:
                "A senha de administrador informada está incorreta, por favor verifique e tente novamente",
        });
    }

    if (senha_banco === "Cubos123Bank") {
        return res.status(200).json(contas);
    }
};

const criarConta = (req, res) => {
    const { nome, cpf, data_nascimento, telefone, email, senha } = req.body;

    if (!nome || !cpf || !data_nascimento || !telefone || !email || !senha) {
        return res.status(400).json({
            mensagem:
                "Os campos nome, cpf, data_nascimento, telefone, email e senha são obrigatórios.",
        });
    }

    const conta = contas.find((conta) => {
        return conta.usuario.cpf === cpf || conta.usuario.email === email;
    });

    if (conta) {
        return res.status(400).json({
            mensagem:
                "O CPF ou o E-mail informados, já estão vinculados a outra conta, por favor verifique e tente novamente.",
        });
    }

    const novaConta = {
        numero: geradorDeNumero++,
        saldo: 0,
        usuario: {
            nome,
            cpf,
            data_nascimento,
            telefone,
            email,
            senha,
        },
    };
    contas.push(novaConta);
    return res.status(201).json();
};

const editarConta = (req, res) => {
    const { numeroConta } = req.params;
    const { nome, cpf, data_nascimento, telefone, email, senha } = req.body;

    if (!nome || !cpf || !data_nascimento || !telefone || !email || !senha) {
        return res.status(400).json({
            mensagem:
                "Os campos nome, cpf, data_nascimento, telefone, email e senha são obrigatórios.",
        });
    }

    const filtrarConta = contas.filter((conta) => {
        return conta.numero !== Number(numeroConta);
    });

    const conta = filtrarConta.some((conta) => {
        return conta.usuario.cpf === cpf || conta.usuario.email === email;
    });

    if (conta) {
        return res.status(400).json({
            mensagem:
                "O CPF ou o E-mail informados, já estão vinculados a outra conta, por favor verifique e tente novamente.",
        });
    }

    let contaFiltrada = contas.find((conta) => {
        return conta.numero === Number(numeroConta);
    });

    contaFiltrada.usuario.nome = nome;
    contaFiltrada.usuario.cpf = cpf;
    contaFiltrada.usuario.data_nascimento = data_nascimento;
    contaFiltrada.usuario.telefone = telefone;
    contaFiltrada.usuario.email = email;
    contaFiltrada.usuario.senha = senha;

    return res.status(201).json();
};

const deletarConta = (req, res) => {
    const { numeroConta } = req.params;
    const { senha } = req.query;

    if (numeroConta <= 0) {
        return res.status(401).json({
            mensage:
                "O numero da conta informado é inválido, por favor informe um número válido",
        });
    }

    if (!senha) {
        return res
            .status(401)
            .json({ mensage: "Por favor informe a senha da conta" });
    }

    const conta = contas.find((conta) => {
        return conta.numero === Number(numeroConta);
    });

    if (!conta) {
        return res.status(400).json({
            mensagem: "Não existe nenhuma conta, correspondente ao numero informado.",
        });
    }

    if (senha !== conta.usuario.senha) {
        return res.status(401).json({
            mensagem:
                "A senha informada está incorreta, por favor verifique e tente novamente",
        });
    }

    if (conta.saldo > 0) {
        return res.status(401).json({
            mensagem: "A conta só pode ser removida se seu saldo estiver zerado",
        });
    }

    const indiceDaConta = contas.findIndex(
        (conta) => conta.numero === Number(numeroConta)
    );

    contas.splice(indiceDaConta, 1);
    return res.status(201).json();
};

const depositar = (req, res) => {
    const { numero_conta, valor } = req.body;
    const valorDoDeposito = valor;

    if (!numero_conta) {
        return res
            .status(400)
            .json({ mensagem: "Por favor informe o numero da conta" });
    }

    if (numero_conta <= 0) {
        return res.status(401).json({
            mensage:
                "O numero da conta informado é inválido, por favor informe um número válido",
        });
    }

    if (!valor) {
        return res
            .status(400)
            .json({ mensagem: "Por favor informe o valor do depósito" });
    }

    if (valorDoDeposito <= 0) {
        return res.status(400).json({
            mensagem: "O valor do depósito não pode ser menor ou igual a 0",
        });
    }

    const conta = contas.find((conta) => {
        return conta.numero === numero_conta;
    });

    if (!conta) {
        return res.status(400).json({
            mensagem: "Não existe nenhuma conta, correspondente ao numero informado.",
        });
    }

    conta.saldo = conta.saldo + valorDoDeposito;

    const registroDeSaques = {
        data: geradorDeData,
        numero_conta: numero_conta,
        valor: valor,
    };

    depositos.push(registroDeSaques);
    return res.status(201).json();
};

const sacar = (req, res) => {
    const { numero_conta, valor, senha } = req.body;
    const valorDoSaque = valor;

    if (!numero_conta) {
        return res
            .status(400)
            .json({ mensagem: "Por favor informe o numero da conta" });
    }

    if (numero_conta <= 0) {
        return res.status(401).json({
            mensage:
                "O numero da conta informado é inválido, por favor informe um número válido",
        });
    }

    if (!valor) {
        return res
            .status(400)
            .json({ mensagem: "Por favor informe o valor a ser sacado" });
    }

    if (!senha) {
        return res.status(400).json({
            mensagem: "Por favor, informe a senha da conta.",
        });
    }

    const conta = contas.find((conta) => {
        return conta.numero === numero_conta;
    });

    if (!conta) {
        return res.status(400).json({
            mensagem: "Não existe nenhuma conta, correspondente ao numero informado.",
        });
    }

    if (senha !== Number(conta.usuario.senha)) {
        return res.status(401).json({
            mensagem:
                "A senha informada está incorreta, por favor verifique e tente novamente",
        });
    }

    if (valorDoSaque <= 0) {
        return res.status(400).json({
            mensagem: "O valor do saque não pode ser menor ou igual a 0",
        });
    }

    if (valorDoSaque > conta.saldo) {
        return res.status(400).json({
            mensagem:
                "O saldo da conta é insuficiente para efetuar o saque solicitado",
        });
    }

    conta.saldo = conta.saldo - valorDoSaque;

    const registroDeSaque = {
        data: geradorDeData,
        numero_conta: numero_conta,
        valor: valor,
    };

    saques.push(registroDeSaque);
    return res.status(201).json();
};

const transferir = (req, res) => {
    const { numero_conta_origem, numero_conta_destino, valor, senha } = req.body;
    const valorDaTransferencia = valor;

    if (!numero_conta_origem) {
        return res
            .status(400)
            .json({ mensagem: "Por favor informe o numero da conta de origem" });
    }

    if (numero_conta_origem <= 0) {
        return res.status(401).json({
            mensage:
                "O numero da conta informado é inválido, por favor informe um número válido",
        });
    }

    if (!numero_conta_destino) {
        return res
            .status(400)
            .json({ mensagem: "Por favor informe o numero da conta de destino" });
    }

    if (numero_conta_destino <= 0) {
        return res.status(401).json({
            mensage:
                "O numero da conta informado é inválido, por favor informe um número válido",
        });
    }

    if (numero_conta_destino === numero_conta_origem) {
        return res.status(400).json({
            mensagem: "Você não pode fazer transferencias para mesma conta",
        });
    }

    if (!valor) {
        return res
            .status(400)
            .json({ mensagem: "Por favor informe o valor a ser transferido" });
    }

    if (!senha) {
        return res.status(400).json({
            mensagem: "Por favor, informe a senha da conta.",
        });
    }

    const contaDeOrigem = contas.find((conta) => {
        return conta.numero === numero_conta_origem;
    });

    if (!contaDeOrigem) {
        return res.status(400).json({
            mensagem: "Não existe nenhuma conta, correspondente ao numero informado.",
        });
    }

    if (senha !== Number(contaDeOrigem.usuario.senha)) {
        return res
            .status(401)
            .json({ mensagem: "A senha informada está incorreta" });
    }

    const contaDeDestino = contas.find((conta) => {
        return conta.numero === numero_conta_destino;
    });

    if (!contaDeDestino) {
        return res.status(400).json({
            mensagem: "Não existe nenhuma conta, correspondente ao numero informado.",
        });
    }

    if (contaDeOrigem === contaDeDestino) {
        return res.status(400).json({
            mensagem:
                "Não é possivel fazer transferencias para a mesma conta, por favor verifique e tente novamente",
        });
    }

    if (valorDaTransferencia <= 0) {
        return res.status(400).json({
            mensagem: "O valor da transferencia não pode ser menor ou igual a 0",
        });
    }

    if (valorDaTransferencia > contaDeOrigem.saldo) {
        return res.status(400).json({
            mensagem:
                "O saldo da conta é insuficiente para efetuar a transferencia solicitada.",
        });
    }

    contaDeOrigem.saldo = contaDeOrigem.saldo - valorDaTransferencia;
    contaDeDestino.saldo = contaDeDestino.saldo + valorDaTransferencia;

    const registroDeTransferencia = {
        data: geradorDeData,
        numero_conta_origem: numero_conta_origem,
        numero_conta_destino: numero_conta_destino,
        valor: valor,
    };

    transferencias.push(registroDeTransferencia);
    return res.status(201).json();
};

const exibirSaldo = (req, res) => {
    const { numero_conta, senha } = req.query;

    if (!numero_conta) {
        return res
            .status(400)
            .json({ mensagem: "Por favor informe o numero da conta" });
    }

    if (!senha) {
        return res.status(400).json({
            mensagem: "Por favor, informe a senha da conta.",
        });
    }

    const conta = contas.find((conta) => {
        return conta.numero === Number(numero_conta);
    });

    if (!conta) {
        return res.status(400).json({
            mensagem: "Não existe nenhuma conta, correspondente ao numero informado.",
        });
    }

    if (senha !== conta.usuario.senha) {
        return res.status(401).json({
            mensagem:
                "A senha informada está incorreta, por favor verifique e tente novamente",
        });
    }

    return res
        .status(200)
        .json({ mensagem: `O saldo da sua conta é: ${conta.saldo}` });
};

const exibirExtrato = (req, res) => {
    const { numero_conta, senha } = req.query;

    if (!numero_conta) {
        return res
            .status(400)
            .json({ mensagem: "Por favor informe o numero da conta" });
    }

    if (!senha) {
        return res.status(400).json({
            mensagem: "Por favor, informe a senha da conta.",
        });
    }

    const conta = contas.find((conta) => {
        return conta.numero === Number(numero_conta);
    });

    if (!conta) {
        return res.status(400).json({
            mensagem: "Não existe nenhuma conta, correspondente ao numero informado.",
        });
    }

    if (senha !== conta.usuario.senha) {
        return res.status(401).json({
            mensagem:
                "A senha informada está incorreta, por favor verifique e tente novamente",
        });
    }

    const extratoDaConta = {
        depositos: [],
        saques: [],
        transferenciasEnviadas: [],
        transferenciasRecebidas: [],
    };

    depositos.forEach((deposito) => {
        if (deposito.numero_conta === Number(numero_conta)) {
            extratoDaConta.depositos.push(deposito);
        }
    });

    saques.forEach((saque) => {
        if (saque.numero_conta === Number(numero_conta)) {
            extratoDaConta.saques.push(saque);
        }
    });

    transferencias.forEach((transferencia) => {
        if (transferencia.numero_conta_origem === Number(numero_conta)) {
            extratoDaConta.transferenciasEnviadas.push(transferencia);
        } else if (transferencia.numero_conta_destino === Number(numero_conta)) {
            extratoDaConta.transferenciasRecebidas.push(transferencia);
        }
    });

    return res.status(200).json(extratoDaConta);
};

module.exports = {
    listarContas,
    criarConta,
    editarConta,
    deletarConta,
    depositar,
    sacar,
    transferir,
    exibirSaldo,
    exibirExtrato,
};