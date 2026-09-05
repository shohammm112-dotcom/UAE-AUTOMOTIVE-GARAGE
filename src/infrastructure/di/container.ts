import { ICustomerRepository } from '../../domain/repositories/ICustomerRepository.ts';
import { IVehicleRepository } from '../../domain/repositories/IVehicleRepository.ts';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository.ts';
import { IJobRepository } from '../../domain/repositories/IJobRepository.ts';
import { IInspectionRepository } from '../../domain/repositories/IInspectionRepository.ts';
import { IEstimateRepository } from '../../domain/repositories/IEstimateRepository.ts';
import { IApprovalRepository } from '../../domain/repositories/IApprovalRepository.ts';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository.ts';
import { INotificationRepository } from '../../domain/repositories/INotificationRepository.ts';
import { IIdempotencyRepository } from '../../domain/repositories/IIdempotencyRepository.ts';
import { IEventBus } from '../../domain/events/DomainEvent.ts';
import { IAuthTokenVerifier } from '../../application/security/IAuthTokenVerifier.ts';

import { MockCustomerRepository } from '../mock/MockCustomerRepository.ts';
import { MockVehicleRepository } from '../mock/MockVehicleRepository.ts';
import { MockAppointmentRepository } from '../mock/MockAppointmentRepository.ts';
import { MockJobRepository } from '../mock/MockJobRepository.ts';
import { MockInspectionRepository } from '../mock/MockInspectionRepository.ts';
import { MockEstimateRepository } from '../mock/MockEstimateRepository.ts';
import { MockApprovalRepository } from '../mock/MockApprovalRepository.ts';
import { MockInvoiceRepository } from '../mock/MockInvoiceRepository.ts';
import { MockNotificationRepository } from '../mock/MockNotificationRepository.ts';
import { MockIdempotencyRepository } from '../mock/MockIdempotencyRepository.ts';
import { MockAuthTokenVerifier } from '../mock/MockAuthTokenVerifier.ts';
import { InMemoryEventBus } from '../mock/InMemoryEventBus.ts';

import { FirestoreClient } from '../firebase/firestore/FirestoreClient.ts';
import { FirestoreCustomerRepository } from '../firebase/repositories/FirestoreCustomerRepository.ts';
import { FirestoreVehicleRepository } from '../firebase/repositories/FirestoreVehicleRepository.ts';
import { FirestoreAppointmentRepository } from '../firebase/repositories/FirestoreAppointmentRepository.ts';
import { FirestoreJobRepository } from '../firebase/repositories/FirestoreJobRepository.ts';
import { FirestoreInspectionRepository } from '../firebase/repositories/FirestoreInspectionRepository.ts';
import { FirestoreEstimateRepository } from '../firebase/repositories/FirestoreEstimateRepository.ts';
import { FirestoreApprovalRepository } from '../firebase/repositories/FirestoreApprovalRepository.ts';
import { FirestoreInvoiceRepository } from '../firebase/repositories/FirestoreInvoiceRepository.ts';
import { FirestoreNotificationRepository } from '../firebase/repositories/FirestoreNotificationRepository.ts';
import { FirestoreIdempotencyRepository } from '../firebase/repositories/FirestoreIdempotencyRepository.ts';
import { FirebaseAuthAdapter } from '../firebase/auth/FirebaseAuthAdapter.ts';
import { FirebaseConfig, FirebaseServerConfig } from '../firebase/config/FirebaseConfig.ts';

import { IDocumentStorageService } from '../storage/IDocumentStorageService.ts';
import { MockDocumentStorageService } from '../storage/MockDocumentStorageService.ts';

import { CustomerApplicationService } from '../../application/services/CustomerApplicationService.ts';
import { VehicleApplicationService } from '../../application/services/VehicleApplicationService.ts';
import { AppointmentApplicationService } from '../../application/services/AppointmentApplicationService.ts';
import { JobApplicationService } from '../../application/services/JobApplicationService.ts';
import { EstimateApplicationService } from '../../application/services/EstimateApplicationService.ts';
import { InvoiceApplicationService } from '../../application/services/InvoiceApplicationService.ts';
import { DocumentAccessApplicationService } from '../../application/services/DocumentAccessApplicationService.ts';

export interface AppContainer {
  readonly mode: 'mock' | 'firebase';
  readonly repositories: {
    readonly customerRepo: ICustomerRepository;
    readonly vehicleRepo: IVehicleRepository;
    readonly appointmentRepo: IAppointmentRepository;
    readonly jobRepo: IJobRepository;
    readonly inspectionRepo: IInspectionRepository;
    readonly estimateRepo: IEstimateRepository;
    readonly approvalRepo: IApprovalRepository;
    readonly invoiceRepo: IInvoiceRepository;
    readonly notificationRepo: INotificationRepository;
    readonly idempotencyRepo: IIdempotencyRepository;
  };
  readonly eventBus: IEventBus;
  readonly authVerifier: IAuthTokenVerifier;
  readonly storageService: IDocumentStorageService;
  readonly services: {
    readonly customerService: CustomerApplicationService;
    readonly vehicleService: VehicleApplicationService;
    readonly appointmentService: AppointmentApplicationService;
    readonly jobService: JobApplicationService;
    readonly estimateService: EstimateApplicationService;
    readonly invoiceService: InvoiceApplicationService;
    readonly documentService: DocumentAccessApplicationService;
  };
}

export interface ContainerCreationOptions {
  mode?: 'mock' | 'firebase';
  firebaseConfig?: FirebaseServerConfig;
  customAuthVerifier?: IAuthTokenVerifier;
  customStorageService?: IDocumentStorageService;
}

export function createApplicationContainer(options?: ContainerCreationOptions): AppContainer {
  const chosenMode = options?.mode || (FirebaseConfig.getProvider() === 'firebase' ? 'firebase' : 'mock');

  const eventBus = new InMemoryEventBus();
  let customerRepo: ICustomerRepository;
  let vehicleRepo: IVehicleRepository;
  let appointmentRepo: IAppointmentRepository;
  let jobRepo: IJobRepository;
  let inspectionRepo: IInspectionRepository;
  let estimateRepo: IEstimateRepository;
  let approvalRepo: IApprovalRepository;
  let invoiceRepo: IInvoiceRepository;
  let notificationRepo: INotificationRepository;
  let idempotencyRepo: IIdempotencyRepository;
  let authVerifier: IAuthTokenVerifier;
  const storageService: IDocumentStorageService = options?.customStorageService || new MockDocumentStorageService();

  if (chosenMode === 'firebase') {
    const firestoreClient = new FirestoreClient(undefined, options?.firebaseConfig);
    customerRepo = new FirestoreCustomerRepository(firestoreClient);
    vehicleRepo = new FirestoreVehicleRepository(firestoreClient);
    appointmentRepo = new FirestoreAppointmentRepository(firestoreClient);
    jobRepo = new FirestoreJobRepository(firestoreClient);
    inspectionRepo = new FirestoreInspectionRepository(firestoreClient);
    estimateRepo = new FirestoreEstimateRepository(firestoreClient);
    approvalRepo = new FirestoreApprovalRepository(firestoreClient);
    invoiceRepo = new FirestoreInvoiceRepository(firestoreClient);
    notificationRepo = new FirestoreNotificationRepository(firestoreClient);
    idempotencyRepo = new FirestoreIdempotencyRepository(firestoreClient);
    authVerifier = options?.customAuthVerifier || new FirebaseAuthAdapter(options?.firebaseConfig);
  } else {
    // Development / Test mode with mock in-memory stores
    const mockEstimateRepo = new MockEstimateRepository();
    const mockApprovalRepo = new MockApprovalRepository(mockEstimateRepo);

    customerRepo = new MockCustomerRepository();
    vehicleRepo = new MockVehicleRepository();
    appointmentRepo = new MockAppointmentRepository();
    jobRepo = new MockJobRepository();
    inspectionRepo = new MockInspectionRepository();
    estimateRepo = mockEstimateRepo;
    approvalRepo = mockApprovalRepo;
    invoiceRepo = new MockInvoiceRepository();
    notificationRepo = new MockNotificationRepository();
    idempotencyRepo = new MockIdempotencyRepository();
    authVerifier = options?.customAuthVerifier || new MockAuthTokenVerifier();
  }

  const customerService = new CustomerApplicationService(customerRepo);
  const vehicleService = new VehicleApplicationService(vehicleRepo);
  const appointmentService = new AppointmentApplicationService(appointmentRepo, vehicleRepo);
  const jobService = new JobApplicationService(jobRepo, inspectionRepo, vehicleRepo);
  const estimateService = new EstimateApplicationService(
    estimateRepo,
    approvalRepo,
    jobRepo,
    idempotencyRepo,
    eventBus
  );
  const invoiceService = new InvoiceApplicationService(
    invoiceRepo,
    approvalRepo,
    estimateRepo,
    eventBus,
    customerRepo
  );
  const documentService = new DocumentAccessApplicationService(
    storageService,
    jobRepo,
    inspectionRepo,
    invoiceRepo
  );

  return {
    mode: chosenMode,
    repositories: {
      customerRepo,
      vehicleRepo,
      appointmentRepo,
      jobRepo,
      inspectionRepo,
      estimateRepo,
      approvalRepo,
      invoiceRepo,
      notificationRepo,
      idempotencyRepo,
    },
    eventBus,
    authVerifier,
    storageService,
    services: {
      customerService,
      vehicleService,
      appointmentService,
      jobService,
      estimateService,
      invoiceService,
      documentService,
    },
  };
}
