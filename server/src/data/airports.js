export const AIRPORTS = [
  // Brasil - São Paulo e Região
  { iata: 'GRU', name: 'Aeroporto Internacional de São Paulo/Guarulhos', city: 'São Paulo', state: 'SP', country: 'Brasil' },
  { iata: 'CGH', name: 'Aeroporto de São Paulo/Congonhas', city: 'São Paulo', state: 'SP', country: 'Brasil' },
  { iata: 'VCP', name: 'Aeroporto Internacional de Viracopos', city: 'Campinas', state: 'SP', country: 'Brasil' },
  { iata: 'RAO', name: 'Aeroporto Leite Lopes', city: 'Ribeirão Preto', state: 'SP', country: 'Brasil' },
  { iata: 'SJP', name: 'Aeroporto de São José do Rio Preto', city: 'São José do Rio Preto', state: 'SP', country: 'Brasil' },
  { iata: 'SJK', name: 'Aeroporto de São José dos Campos', city: 'São José dos Campos', state: 'SP', country: 'Brasil' },

  // Brasil - Rio de Janeiro
  { iata: 'SDU', name: 'Aeroporto Santos Dumont', city: 'Rio de Janeiro', state: 'RJ', country: 'Brasil' },
  { iata: 'GIG', name: 'Aeroporto Internacional Tom Jobim/Galeão', city: 'Rio de Janeiro', state: 'RJ', country: 'Brasil' },
  { iata: 'CFB', name: 'Aeroporto Internacional de Cabo Frio', city: 'Cabo Frio', state: 'RJ', country: 'Brasil' },

  // Brasil - Centro-Oeste
  { iata: 'BSB', name: 'Aeroporto Internacional de Brasília', city: 'Brasília', state: 'DF', country: 'Brasil' },
  { iata: 'GYN', name: 'Aeroporto de Goiânia/Santa Genoveva', city: 'Goiânia', state: 'GO', country: 'Brasil' },
  { iata: 'CGB', name: 'Aeroporto Internacional de Cuiabá/Marechal Rondon', city: 'Cuiabá', state: 'MT', country: 'Brasil' },
  { iata: 'CGR', name: 'Aeroporto Internacional de Campo Grande', city: 'Campo Grande', state: 'MS', country: 'Brasil' },
  { iata: 'CLV', name: 'Aeroporto de Caldas Novas', city: 'Caldas Novas', state: 'GO', country: 'Brasil' },

  // Brasil - Minas Gerais & Espírito Santo
  { iata: 'CNF', name: 'Aeroporto Internacional de Belo Horizonte/Confins', city: 'Belo Horizonte', state: 'MG', country: 'Brasil' },
  { iata: 'PLU', name: 'Aeroporto de Belo Horizonte/Pampulha', city: 'Belo Horizonte', state: 'MG', country: 'Brasil' },
  { iata: 'UDI', name: 'Aeroporto Ten. Cel. Av. César Bombonato', city: 'Uberlândia', state: 'MG', country: 'Brasil' },
  { iata: 'MOC', name: 'Aeroporto de Montes Claros', city: 'Montes Claros', state: 'MG', country: 'Brasil' },
  { iata: 'JDF', name: 'Aeroporto Regional de Juiz de Fora', city: 'Juiz de Fora', state: 'MG', country: 'Brasil' },
  { iata: 'VIX', name: 'Aeroporto de Vitória/Eurico de Aguiar Salles', city: 'Vitória', state: 'ES', country: 'Brasil' },

  // Brasil - Sul
  { iata: 'FLN', name: 'Aeroporto Internacional de Florianópolis/Hercílio Luz', city: 'Florianópolis', state: 'SC', country: 'Brasil' },
  { iata: 'CWB', name: 'Aeroporto Internacional de Curitiba/Afonso Pena', city: 'Curitiba', state: 'PR', country: 'Brasil' },
  { iata: 'POA', name: 'Aeroporto Internacional Salgado Filho', city: 'Porto Alegre', state: 'RS', country: 'Brasil' },
  { iata: 'NVT', name: 'Aeroporto Internacional de Navegantes (Balneário Camboriú)', city: 'Navegantes', state: 'SC', country: 'Brasil' },
  { iata: 'JOI', name: 'Aeroporto de Joinville/Lauro Carneiro de Loyola', city: 'Joinville', state: 'SC', country: 'Brasil' },
  { iata: 'XAP', name: 'Aeroporto de Chapecó/Serafin Enoss Bertaso', city: 'Chapecó', state: 'SC', country: 'Brasil' },
  { iata: 'IGU', name: 'Aeroporto Internacional de Foz do Iguaçu', city: 'Foz do Iguaçu', state: 'PR', country: 'Brasil' },
  { iata: 'LDB', name: 'Aeroporto de Londrina/Governador José Richa', city: 'Londrina', state: 'PR', country: 'Brasil' },
  { iata: 'MGF', name: 'Aeroporto Regional de Maringá', city: 'Maringá', state: 'PR', country: 'Brasil' },
  { iata: 'CXJ', name: 'Aeroporto de Caxias do Sul/Hugo Cantergiani', city: 'Caxias do Sul', state: 'RS', country: 'Brasil' },
  { iata: 'PET', name: 'Aeroporto Internacional de Pelotas', city: 'Pelotas', state: 'RS', country: 'Brasil' },

  // Brasil - Nordeste
  { iata: 'SSA', name: 'Aeroporto Internacional de Salvador', city: 'Salvador', state: 'BA', country: 'Brasil' },
  { iata: 'REC', name: 'Aeroporto Internacional do Recife/Guararapes', city: 'Recife', state: 'PE', country: 'Brasil' },
  { iata: 'FOR', name: 'Aeroporto Internacional de Fortaleza', city: 'Fortaleza', state: 'CE', country: 'Brasil' },
  { iata: 'MCZ', name: 'Aeroporto Internacional de Maceió/Zumbi dos Palmares', city: 'Maceió', state: 'AL', country: 'Brasil' },
  { iata: 'NAT', name: 'Aeroporto Internacional de Natal', city: 'Natal', state: 'RN', country: 'Brasil' },
  { iata: 'IOS', name: 'Aeroporto de Ilhéus/Jorge Amado', city: 'Ilhéus', state: 'BA', country: 'Brasil' },
  { iata: 'BPS', name: 'Aeroporto de Porto Seguro', city: 'Porto Seguro', state: 'BA', country: 'Brasil' },
  { iata: 'AJU', name: 'Aeroporto de Aracaju/Santa Maria', city: 'Aracaju', state: 'SE', country: 'Brasil' },
  { iata: 'JPA', name: 'Aeroporto Internacional de João Pessoa', city: 'João Pessoa', state: 'PB', country: 'Brasil' },
  { iata: 'SLZ', name: 'Aeroporto Internacional de São Luís', city: 'São Luís', state: 'MA', country: 'Brasil' },
  { iata: 'THE', name: 'Aeroporto de Teresina/Senador Petrônio Portella', city: 'Teresina', state: 'PI', country: 'Brasil' },
  { iata: 'PNZ', name: 'Aeroporto de Petrolina/Senador Nilo Coelho', city: 'Petrolina', state: 'PE', country: 'Brasil' },
  { iata: 'IMP', name: 'Aeroporto de Imperatriz', city: 'Imperatriz', state: 'MA', country: 'Brasil' },
  { iata: 'FEN', name: 'Aeroporto de Fernando de Noronha', city: 'Fernando de Noronha', state: 'PE', country: 'Brasil' },
  { iata: 'JJD', name: 'Aeroporto Regional de Jericoacoara', city: 'Jericoacoara', state: 'CE', country: 'Brasil' },

  // Brasil - Norte
  { iata: 'MAO', name: 'Aeroporto Internacional de Manaus/Eduardo Gomes', city: 'Manaus', state: 'AM', country: 'Brasil' },
  { iata: 'BEL', name: 'Aeroporto Internacional de Belém/Val-de-Cans', city: 'Belém', state: 'PA', country: 'Brasil' },
  { iata: 'STM', name: 'Aeroporto de Santarém/Maestro Wilson Fonseca', city: 'Santarém', state: 'PA', country: 'Brasil' },
  { iata: 'BVB', name: 'Aeroporto Internacional de Boa Vista', city: 'Boa Vista', state: 'RR', country: 'Brasil' },
  { iata: 'RBR', name: 'Aeroporto Internacional de Rio Branco', city: 'Rio Branco', state: 'AC', country: 'Brasil' },
  { iata: 'PVH', name: 'Aeroporto Internacional de Porto Velho', city: 'Porto Velho', state: 'RO', country: 'Brasil' },
  { iata: 'MCP', name: 'Aeroporto Internacional de Macapá', city: 'Macapá', state: 'AP', country: 'Brasil' },
  { iata: 'PMW', name: 'Aeroporto de Palmas/Brigadeiro Lysias Rodrigues', city: 'Palmas', state: 'TO', country: 'Brasil' },

  // América do Sul & Caribe
  { iata: 'EZE', name: 'Aeroporto Internacional Ministro Pistarini/Ezeiza', city: 'Buenos Aires', state: 'BA', country: 'Argentina' },
  { iata: 'AEP', name: 'Aeroparque Jorge Newbery', city: 'Buenos Aires', state: 'BA', country: 'Argentina' },
  { iata: 'BRC', name: 'Aeroporto Internacional Teniente Luis Candelaria', city: 'Bariloche', state: 'RN', country: 'Argentina' },
  { iata: 'SCL', name: 'Aeroporto Internacional Comodoro Arturo Merino Benítez', city: 'Santiago', state: 'RM', country: 'Chile' },
  { iata: 'MVD', name: 'Aeroporto Internacional de Carrasco', city: 'Montevidéu', state: 'MO', country: 'Uruguai' },
  { iata: 'PDP', name: 'Aeroporto Internacional de Laguna del Sauce', city: 'Punta del Este', state: 'MA', country: 'Uruguai' },
  { iata: 'LIM', name: 'Aeroporto Internacional Jorge Chávez', city: 'Lima', state: 'LIM', country: 'Peru' },
  { iata: 'CUZ', name: 'Aeroporto Internacional Alejandro Velasco Astete', city: 'Cusco', state: 'CUS', country: 'Peru' },
  { iata: 'BOG', name: 'Aeroporto Internacional El Dorado', city: 'Bogotá', state: 'DC', country: 'Colômbia' },
  { iata: 'MDE', name: 'Aeroporto Internacional José María Córdova', city: 'Medellín', state: 'ANT', country: 'Colômbia' },
  { iata: 'CTG', name: 'Aeroporto Internacional Rafael Núñez', city: 'Cartagena', state: 'BOL', country: 'Colômbia' },
  { iata: 'PUJ', name: 'Aeroporto Internacional de Punta Cana', city: 'Punta Cana', state: 'LA', country: 'República Dominicana' },
  { iata: 'CUN', name: 'Aeroporto Internacional de Cancún', city: 'Cancún', state: 'QR', country: 'México' },
  { iata: 'MEX', name: 'Aeroporto Internacional Benito Juárez', city: 'Cidade do México', state: 'MEX', country: 'México' },

  // América do Norte
  { iata: 'MIA', name: 'Aeroporto Internacional de Miami', city: 'Miami', state: 'FL', country: 'Estados Unidos' },
  { iata: 'MCO', name: 'Aeroporto Internacional de Orlando', city: 'Orlando', state: 'FL', country: 'Estados Unidos' },
  { iata: 'JFK', name: 'Aeroporto Internacional John F. Kennedy', city: 'Nova York', state: 'NY', country: 'Estados Unidos' },
  { iata: 'EWR', name: 'Aeroporto Internacional de Newark Liberty', city: 'Nova York / Newark', state: 'NJ', country: 'Estados Unidos' },
  { iata: 'LAX', name: 'Aeroporto Internacional de Los Angeles', city: 'Los Angeles', state: 'CA', country: 'Estados Unidos' },
  { iata: 'SFO', name: 'Aeroporto Internacional de São Francisco', city: 'São Francisco', state: 'CA', country: 'Estados Unidos' },
  { iata: 'ORD', name: 'Aeroporto Internacional O\'Hare', city: 'Chicago', state: 'IL', country: 'Estados Unidos' },

  // Europa
  { iata: 'LIS', name: 'Aeroporto Humberto Delgado', city: 'Lisboa', state: 'LX', country: 'Portugal' },
  { iata: 'OPO', name: 'Aeroporto Francisco Sá Carneiro', city: 'Porto', state: 'PT', country: 'Portugal' },
  { iata: 'MAD', name: 'Aeroporto Adolfo Suárez Madrid-Barajas', city: 'Madri', state: 'MD', country: 'Espanha' },
  { iata: 'BCN', name: 'Aeroporto Josep Tarradellas Barcelona-El Prat', city: 'Barcelona', state: 'CT', country: 'Espanha' },
  { iata: 'CDG', name: 'Aeroporto Internacional Charles de Gaulle', city: 'Paris', state: 'IDF', country: 'França' },
  { iata: 'ORY', name: 'Aeroporto de Paris-Orly', city: 'Paris', state: 'IDF', country: 'França' },
  { iata: 'FCO', name: 'Aeroporto Internacional Leonardo da Vinci/Fiumicino', city: 'Roma', state: 'LAZ', country: 'Itália' },
  { iata: 'MXP', name: 'Aeroporto Internacional de Milão-Malpensa', city: 'Milão', state: 'LOM', country: 'Itália' },
  { iata: 'LHR', name: 'Aeroporto de Londres-Heathrow', city: 'Londres', state: 'ENG', country: 'Reino Unido' },
  { iata: 'AMS', name: 'Aeroporto de Amsterdã-Schiphol', city: 'Amsterdã', state: 'NH', country: 'Holanda' },
  { iata: 'FRA', name: 'Aeroporto de Frankfurt', city: 'Frankfurt', state: 'HE', country: 'Alemanha' }
];
