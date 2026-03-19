export const pt = {
  forms: {
    instructor: {
      user: 'Usuário',
      bio: 'Biografia',
      yearsOfExperience: 'Anos de experiência',
      pricePerHour: 'Preço por hora',
      rating: 'Avaliação',
      totalLessons: 'Total de aulas',
      totalReviews: 'Total de avaliações',
      transmissionType: 'Tipo de câmbio',
      vehicleAvailability: 'Disponibilidade de veículo',
      vehicleModel: 'Modelo do veículo',
      vehiclePlate: 'Placa do veículo',
      hasDoublePedals: 'Possui pedais duplos',
      cnhNumber: 'Número da CNH',
      cnhExpiry: 'Validade da CNH',
      instructorCertificate: 'Certificado de instrutor',
      detranCredential: 'Credencial do DETRAN',
      credentialExpiry: 'Validade da credencial',
      serviceAreas: 'Áreas de atendimento',
      serviceRadius: 'Raio de atendimento',
      address: 'Endereço',
      latitude: 'Latitude',
      longitude: 'Longitude',
      location: 'Localização',
      isActive: 'Ativo',
      isVerified: 'Verificado',
      verificationDate: 'Data de verificação',
      specializations: 'Especializações',
      languages: 'Idiomas',
      instructorCode: 'Código do instrutor',
      instructorAvailability: 'Disponibilidade do instrutor',
      blockedTimeSlot: 'Horários bloqueados',
      availabilityStatus: 'Status de disponibilidade',
      lastAvailabilityChange: 'Última alteração de disponibilidade'
    },
    table: {
      instructorAvailability: {
        id: 'ID',
        dayOfWeek: 'Dia da semana',
        startTime: 'Horário inicial',
        endTime: 'Horário final',
        isActive: 'Ativo',
        createdAt: 'Criado em',
        updatedAt: 'Atualizado em'
      },
      blockedTimeSlot: {
        id: 'ID',
        date: 'Data',
        startTime: 'Horário',
        reason: 'Motivo',
        createdAt: 'Criado em'
      }
    },
    commons: {
      show: 'Mostrar',
      entries: 'registros',
      submit: 'Salvar',
      saving: 'Salvando...',
      select: 'Selecionar',
      noData: 'Nenhum dado disponível',
      loading: 'Carregando...',
      new: 'Novo',
      editing: 'Editando'
    },
    user: {
      name: 'Nome',
      email: 'E-mail',
      phone: 'Telefone',
      cpf: 'CPF',
      userType: 'Tipo de usuário',
      isActive: 'Ativo',
      emailVerified: 'E-mail verificado',
      phoneVerified: 'Telefone verificado',
      photoUrl: 'Foto',
      address: 'Endereço',
      latitude: 'Latitude',
      longitude: 'Longitude',
      location: 'Localização',
      lastLoginAt: 'Último acesso',
      instructor: 'Instrutor'
    },
    blockedtimeslot: {
      instructor: 'Instrutor',
      date: 'Data',
      startTime: 'Horário inicial',
      reason: 'Motivo'
    },
    bookingquotation: {
      instructorId: 'Instrutor',
      studentId: 'Aluno',
      lessonDate: 'Data da aula',
      lessonTime: 'Horário da aula',
      durationHours: 'Duração (horas)',
      locationType: 'Tipo de local'
    }
  },
  enums: {
    TransmissionType: {
      MANUAL: 'Manual',
      AUTOMATIC: 'Automático',
      BOTH: 'Manual e automático'
    },
    VehicleAvailability: {
      WITH_CAR: 'Com veículo',
      WITHOUT_CAR: 'Sem veículo',
      BOTH: 'Com ou sem veículo'
    },
    AvailabilityStatus: {
      AVAILABLE: 'Disponível',
      UNAVAILABLE: 'Indisponível',
      BUSY: 'Ocupado'
    }
  },
  search: {
    contacts: 'Contatos',
    messages: 'Mensagens',
    results: 'Resultados',
    input: 'Pesquisar',
    context: {
      user: 'Usuários',
      message: 'Mensagens'
    }
  },
  login: {
    welcome: 'Bem-vindo de volta',
    subtitle: 'Por favor, faça login para continuar',
    username: 'Nome de usuário',
    password: 'Senha',
    remember: 'Lembrar de mim',
    forgot: 'Esqueceu a senha?',
    signin: 'Entrar',
    reset: 'Redefinir senha',
    back: 'Voltar',
    code: 'Código de verificação',
    password_confirmation: 'Confirmação de senha',
    logout: 'Sair'
  },
  status: {
    online: 'Online',
    offline: 'Offline',
    away: 'Ausente',
    busy: 'Ocupado',
    undefined: 'Desconhecido'
  },
  notification: {
    interview: 'Entrevista',
    event: 'Evento',
    alert: 'Alerta'
  },
  validations: {
    required: 'O campo {field} é obrigatório',
    email: 'O campo {field} deve ser um e-mail válido',
    confirmed: 'As senhas precisam ser iguais',
    password_confirmation: 'O campo {field} deve ser igual ao campo Senha'
  },
  upload: {
    files: 'Arquivos',
    select: 'Selecione um arquivo',
    clear: 'Limpar',
    upload: 'Enviar'
  },
  widget: {
    configuration: 'Configuração',
    unreadmessages: {
      form: {
        size: 'Tamanho',
        refresh_time: 'Tempo de Atualização'
      }
    }
  },
  widgets: {
    add_some_widget: 'Adicione algum widget',
    click_to_add: 'Clique para adicionar'
  },
  message: {
    notification: {
      interview: 'Você tem uma nova entrevista agendada',
      event: 'Você tem um novo evento',
      alert: 'Atenção'
    }
  },
  form: {
    commons: {
      placeholder: 'Preencha este campo',
      search: 'Pesquisar'
    }
  }
}
