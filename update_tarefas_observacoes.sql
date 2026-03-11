BEGIN;

UPDATE tarefas_template SET observacoes = 'Deverá gerar o Arquivo ECF ICMS/IPI com registro 1600; Bloco H e K, e fazer a conversão de unidades corretamente.' WHERE ordem = 2;
UPDATE tarefas_template SET observacoes = 'Cadastro dos produtos dentro do sistema/ERP, todos saneados com tributação correta e benefícios fiscais aplicados.' WHERE ordem = 3;
UPDATE tarefas_template SET observacoes = 'Os benefícios por operação se aplica quando a operação enquadrar nas condições da Lei. Portanto neste caso não é o produto que tem o benefício, mas a operação fiscal.' WHERE ordem = 7;
UPDATE tarefas_template SET observacoes = 'Fazer o contrato de aluguel para que o cliente faça a transferência da titularidade da conta.' WHERE ordem = 8;
UPDATE tarefas_template SET observacoes = 'Verificar as regras para constituição de CSC.' WHERE ordem = 9;
UPDATE tarefas_template SET observacoes = 'Como forma de legalidade deverá haver o contrato de locação do imóvel, mesmo que seja de membros da família da empresa.' WHERE ordem = 10;
UPDATE tarefas_template SET observacoes = 'Levantar o quadro funcional considerando os cargos e a adesão do saque aniversário que impede a transferência para a CSC.' WHERE ordem = 11;
UPDATE tarefas_template SET observacoes = 'Após aprovação da proposta abrir processo para alteração dos funcionários selecionados para a CSC.' WHERE ordem = 12;
UPDATE tarefas_template SET observacoes = 'Anexar o Alvará de Funcionamento e Bombeiros para comprovar a tarefa realizada.' WHERE ordem = 13;
UPDATE tarefas_template SET observacoes = 'Indicar a abertura no Banco Cora e enviar link ao cliente. Verificar se o Banco Cora registrou como indicação da L&M.' WHERE ordem = 14;
UPDATE tarefas_template SET observacoes = 'Firmar os contratos de prestação de serviços conforme mão de obra segregada.' WHERE ordem = 15;
UPDATE tarefas_template SET observacoes = 'Criar o processo de como será a emissão das NFS-e segregadas pelas atividades terceirizadas conforme CNAEs x Centro de Custos. Liquidez mínima de 3%.' WHERE ordem = 16;
UPDATE tarefas_template SET observacoes = 'Verificar se o cliente procedeu a emissão das notas segregadas e realizou o pagamento corretamente.' WHERE ordem = 17;
UPDATE tarefas_template SET observacoes = 'Realizar o levantamento do patrimônio para cadastro no balanço e depreciação.' WHERE ordem = 18;
UPDATE tarefas_template SET observacoes = 'Apresentar o processo de baixa de perdas através da emissão das NF-e conforme estratégias de mercadorias tributadas, substituição e isentas.' WHERE ordem = 24;
UPDATE tarefas_template SET observacoes = 'Orientar o envio mensal das contas com mais de 6 meses de vencimento com a NF-e emitida.' WHERE ordem = 25;
UPDATE tarefas_template SET observacoes = 'Treinar a equipe para que todas as compras de uso e consumo sejam emitidas em NF-e em nome da empresa do Lucro Real.' WHERE ordem = 30;
UPDATE tarefas_template SET observacoes = 'Demonstrar como será a emissão das notas fiscais de venda, o processo de compra, industrialização, estoque, contas a pagar, contas a receber e conciliação.' WHERE ordem = 36;
UPDATE tarefas_template SET observacoes = 'Verificar se as notas de compra da padaria estão sendo separadas corretamente e se a transposição de estoque está sendo feita para aproveitar créditos de PIS e COFINS.' WHERE ordem = 38;

COMMIT;
