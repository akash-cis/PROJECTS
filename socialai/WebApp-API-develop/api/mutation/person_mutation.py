from api.utils import SQLAlchemyMutationAingine, SQLAlchemyRemoveMutationAingine
from funnel_models import models
import api.schema as schema


class CreatePersonAddress(SQLAlchemyMutationAingine):
    class Meta:
        model = models.PersonAddress
        object_type = schema.PersonAddress


class CreatePersonEmail(SQLAlchemyMutationAingine):
    class Meta:
        model = models.PersonEmail
        object_type = schema.PersonEmail


class CreatePersonSource(SQLAlchemyMutationAingine):
    class Meta:
        model = models.PersonSource
        object_type = schema.PersonSource


class CreatePersonImage(SQLAlchemyMutationAingine):
    class Meta:
        model = models.PersonImage
        object_type = schema.PersonImage


class CreatePersonPhoneNumber(SQLAlchemyMutationAingine):
    class Meta:
        model = models.PersonPhoneNumber
        object_type = schema.PersonPhoneNumber


class CreatePersonExperience(SQLAlchemyMutationAingine):
    class Meta:
        model = models.PersonExperience
        object_type = schema.PersonExperience


class CreatePersonEducation(SQLAlchemyMutationAingine):
    class Meta:
        model = models.PersonEducation
        object_type = schema.PersonEducation


class CreatePersonPossession(SQLAlchemyMutationAingine):
    class Meta:
        model = models.PersonPossession
        object_type = schema.PersonPossession


class CreateVehicleDetail(SQLAlchemyMutationAingine):
    class Meta:
        model = models.VehicleDetail
        object_type = schema.VehicleDetail


class CreateEstateDetail(SQLAlchemyMutationAingine):
    class Meta:
        model = models.EstateDetail
        object_type = schema.EstateDetail


class CreatePersonSkill(SQLAlchemyMutationAingine):
    class Meta:
        model = models.PersonSkill
        object_type = schema.PersonSkill


class CreatePersonLanguage(SQLAlchemyMutationAingine):
    class Meta:
        model = models.PersonLanguage
        object_type = schema.PersonLanguage


class CreatePersonInterest(SQLAlchemyMutationAingine):
    class Meta:
        model = models.PersonInterest
        object_type = schema.PersonInterest


class CreatePersonAccomplishment(SQLAlchemyMutationAingine):
    class Meta:
        model = models.PersonAccomplishment
        object_type = schema.PersonAccomplishment


class CreatePersonLicenseCertificate(SQLAlchemyMutationAingine):
    class Meta:
        model = models.PersonLicenseCertificate
        object_type = schema.PersonLicenseCertificate


class CreatePersonVolunteering(SQLAlchemyMutationAingine):
    class Meta:
        model = models.PersonVolunteering
        object_type = schema.PersonVolunteering


class CreatePersonPublication(SQLAlchemyMutationAingine):
    class Meta:
        model = models.PersonPublication
        object_type = schema.PersonPublication


class CreatePersonAward(SQLAlchemyMutationAingine):
    class Meta:
        model = models.PersonAward
        object_type = schema.PersonAward


class UpdatePersonAddress(SQLAlchemyMutationAingine):
    class Meta:
        model = models.PersonAddress
        object_type = schema.PersonAddress
        action = "Update"


class UpdatePersonEmail(SQLAlchemyMutationAingine):
    class Meta:
        model = models.PersonEmail
        object_type = schema.PersonEmail
        action = "Update"


class UpdatePersonSource(SQLAlchemyMutationAingine):
    class Meta:
        model = models.PersonSource
        object_type = schema.PersonSource
        action = "Update"


class UpdatePersonImage(SQLAlchemyMutationAingine):
    class Meta:
        model = models.PersonImage
        object_type = schema.PersonImage
        action = "Update"


class UpdatePersonPhoneNumber(SQLAlchemyMutationAingine):
    class Meta:
        model = models.PersonPhoneNumber
        object_type = schema.PersonPhoneNumber
        action = "Update"


class UpdatePersonExperience(SQLAlchemyMutationAingine):
    class Meta:
        model = models.PersonExperience
        object_type = schema.PersonExperience
        action = "Update"


class UpdatePersonEducation(SQLAlchemyMutationAingine):
    class Meta:
        model = models.PersonEducation
        object_type = schema.PersonEducation
        action = "Update"


class UpdatePersonPossession(SQLAlchemyMutationAingine):
    class Meta:
        model = models.PersonPossession
        object_type = schema.PersonPossession
        action = "Update"


class UpdateVehicleDetail(SQLAlchemyMutationAingine):
    class Meta:
        model = models.VehicleDetail
        object_type = schema.VehicleDetail
        action = "Update"


class UpdateEstateDetail(SQLAlchemyMutationAingine):
    class Meta:
        model = models.EstateDetail
        object_type = schema.EstateDetail
        action = "Update"


class UpdatePersonSkill(SQLAlchemyMutationAingine):
    class Meta:
        model = models.PersonSkill
        object_type = schema.PersonSkill
        action = "Update"


class UpdatePersonInterest(SQLAlchemyMutationAingine):
    class Meta:
        model = models.PersonInterest
        object_type = schema.PersonInterest
        action = "Update"


class UpdatePersonAccomplishment(SQLAlchemyMutationAingine):
    class Meta:
        model = models.PersonAccomplishment
        object_type = schema.PersonAccomplishment
        action = "Update"


class UpdatePersonLicenseCertificate(SQLAlchemyMutationAingine):
    class Meta:
        model = models.PersonLicenseCertificate
        object_type = schema.PersonLicenseCertificate
        action = "Update"


class UpdatePersonVolunteering(SQLAlchemyMutationAingine):
    class Meta:
        model = models.PersonVolunteering
        object_type = schema.PersonVolunteering
        action = "Update"


class UpdatePersonPublication(SQLAlchemyMutationAingine):
    class Meta:
        model = models.PersonPublication
        object_type = schema.PersonPublication
        action = "Update"


class UpdatePersonAward(SQLAlchemyMutationAingine):
    class Meta:
        model = models.PersonAward
        object_type = schema.PersonAward
        action = "Update"


class UpdatePersonLanguage(SQLAlchemyMutationAingine):
    class Meta:
        model = models.PersonLanguage
        object_type = schema.PersonLanguage
        action = "Update"

class RemovePersonPhoneNumber(SQLAlchemyRemoveMutationAingine):
    class Meta:
        model = models.PersonPhoneNumber


class RemovePersonEmail(SQLAlchemyRemoveMutationAingine):
    class Meta:
        model = models.PersonEmail
# class RemovePersonSource(SQLAlchemyRemoveMutationAingine):
#     class Meta:
#         model = models.PersonSource
class RemovePersonImage(SQLAlchemyRemoveMutationAingine):
    class Meta:
        model = models.PersonImage
class RemovePersonExperience(SQLAlchemyRemoveMutationAingine):
    class Meta:
        model = models.PersonExperience
class RemovePersonEducation(SQLAlchemyRemoveMutationAingine):
    class Meta:
        model = models.PersonEducation
class RemovePersonPossession(SQLAlchemyRemoveMutationAingine):
    class Meta:
        model = models.PersonPossession
# class RemoveVehicleDetail(SQLAlchemyRemoveMutationAingine):
#     class Meta:
#         model = models.PersonPhoneNumber
# class RemoveEstateDetail(SQLAlchemyRemoveMutationAingine):
#     class Meta:
#         model = models.PersonPhoneNumber
class RemovePersonSkill(SQLAlchemyRemoveMutationAingine):
    class Meta:
        model = models.PersonSkill
class RemovePersonInterest(SQLAlchemyRemoveMutationAingine):
    class Meta:
        model = models.PersonInterest
class RemovePersonAccomplishment(SQLAlchemyRemoveMutationAingine):
    class Meta:
        model = models.PersonAccomplishment
class RemovePersonLicenseCertificate(SQLAlchemyRemoveMutationAingine):
    class Meta:
        model = models.PersonLicenseCertificate
class RemovePersonVolunteering(SQLAlchemyRemoveMutationAingine):
    class Meta:
        model = models.PersonVolunteering
class RemovePersonPublication(SQLAlchemyRemoveMutationAingine):
    class Meta:
        model = models.PersonPublication
class RemovePersonAward(SQLAlchemyRemoveMutationAingine):
    class Meta:
        model = models.PersonAward
class RemovePersonAddress(SQLAlchemyRemoveMutationAingine):
    class Meta:
        model = models.PersonAddress
class RemovePersonLanguage(SQLAlchemyRemoveMutationAingine):
    class Meta:
        model = models.PersonLanguage