import gql from "graphql-tag"

export const PERSON_MUTATION = {
  CREATE_PERSON_ADDRESS: gql`
    mutation createPersonAddress($personData: CreatePersonAddressInput) {
      createPersonAddress(personAddressData: $personData) {
        ok
      }
    }
  `,

  CREATE_PERSON_EMAIL: gql`
    mutation createPersonEmail($personData: CreatePersonEmailInput) {
      createPersonEmail(personEmailData: $personData) {
        ok
      }
    }
  `,

  CREATE_PERSON_SOURCE: gql`
    mutation createPersonSource($personData: CreatePersonSourceInput) {
      createPersonSource(personSourceData: $personData) {
        ok
      }
    }
  `,

  CREATE_PERSON_IMAGE: gql`
    mutation createPersonImage($personData: CreatePersonImageInput) {
      createPersonImage(personImageData: $personData) {
        ok
      }
    }
  `,

  CREATE_PERSON_PHONE_NUMBER: gql`
    mutation createPersonPhoneNumber($personData: CreatePersonPhoneNumberInput) {
      createPersonPhoneNumber(personPhoneNumberData: $personData) {
        ok
      }
    }
  `,

  CREATE_PERSON_EXPERIENCE: gql`
    mutation createPersonExperience($personData: CreatePersonExperienceInput) {
      createPersonExperience(personExperienceData: $personData) {
        ok
      }
    }
  `,

  CREATE_PERSON_EDUCATION: gql`
    mutation createPersonEducation($personData: CreatePersonEducationInput) {
      createPersonEducation(personEducationData: $personData) {
        ok
      }
    }
  `,

  CREATE_PERSON_POSSESSION: gql`
    mutation createPersonPossession($personData: CreatePersonPossessionInput) {
      createPersonPossession(personPossessionData: $personData) {
        ok
      }
    }
  `,

  CREATE_PERSON_SKILL: gql`
    mutation createPersonSkill($personData: CreatePersonSkillInput) {
      createPersonSkill(personSkillData: $personData) {
        ok
      }
    }
  `,

  CREATE_PERSON_LANGUAGE: gql`
    mutation createPersonLanguage($personData: CreatePersonLanguageInput) {
      createPersonLanguage(personLanguageData: $personData) {
        ok
      }
    }
  `,

  CREATE_PERSON_INTEREST: gql`
    mutation createPersonInterest($personData: CreatePersonInterestInput) {
      createPersonInterest(personInterestData: $personData) {
        ok
      }
    }
  `,

  CREATE_PERSON_ACCOMPLISHMENT: gql`
    mutation createPersonAccomplishment(
      $personData: CreatePersonAccomplishmentInput
    ) {
      createPersonAccomplishment(personAccomplishmentData: $personData) {
        ok
      }
    }
  `,

  CREATE_PERSON_LICENSE_CERTIFICATE: gql`
    mutation createPersonLicenseCertificate(
      $personData: CreatePersonLicenseCertificateInput
    ) {
      createPersonLicenseCertificate(
        personLicenseCertificateData: $personData
      ) {
        ok
      }
    }
  `,

  CREATE_PERSON_VOLUNTEERING: gql`
    mutation createPersonVolunteering($personData: CreatePersonVolunteeringInput) {
      createPersonVolunteering(personVolunteeringData: $personData) {
        ok
      }
    }
  `,

  CREATE_PERSON_PUBLICATION: gql`
    mutation createPersonPublication($personData: CreatePersonPublicationInput) {
      createPersonPublication(personPublicationData: $personData) {
        ok
      }
    }
  `,

  CREATE_PERSON_AWARD: gql`
    mutation createPersonAward($personData: CreatePersonAwardInput) {
      createPersonAward(personAwardData: $personData) {
        ok
      }
    }
  `,

  UNASSIGN_PERSON: gql`
    mutation unassignPerson($personId: Int!, $sourceId: Int!) {
      unassignPerson(personId: $personId, sourceId: $sourceId) {
        ok
      }
    }
  `,

  UPDATE_PERSON: gql`
    mutation updatePerson($personData: UpdatePersonInput) {
      updatePerson(personData: $personData) {
        ok
      }
    }
  `,

  UPDATE_PERSON_USER_ACCOUNT: gql`
    mutation updatePersonUserAccount($personData: UpdatePersonUserAccountInput) {
      updatePersonUserAccount(personUserAccountData: $personData) {
        ok
      }
    }
  `,

  UPDATE_PERSON_ADDRESS: gql`
    mutation updatePersonAddress($personData: UpdatePersonAddressInput) {
      updatePersonAddress(personAddressData: $personData) {
        ok
      }
    }
  `,

  UPDATE_PERSON_EMAIL: gql`
    mutation updatePersonEmail($personData: UpdatePersonEmailInput) {
      updatePersonEmail(personEmailData: $personData) {
        ok
      }
    }
  `,

  UPDATE_PERSON_SOURCE: gql`
    mutation updatePersonSource($personData: UpdatePersonSourceInput) {
      updatePersonSource(personSourceData: $personData) {
        ok
      }
    }
  `,

  UPDATE_PERSON_USER_ACCOUNT: gql`
    mutation updatePersonUserAccount($personData: UpdatePersonUserAccountInput) {
      updatePersonUserAccount(personUserAccountData: $personData) {
        ok
      }
    }
  `,

  UPDATE_PERSON_IMAGE: gql`
    mutation updatePersonImage($personData: UpdatePersonImageInput) {
      updatePersonImage(personImageData: $personData) {
        ok
      }
    }
  `,

  UPDATE_PERSON_PHONE_NUMBER: gql`
    mutation updatePersonPhoneNumber($personData: UpdatePersonPhoneNumberInput) {
      updatePersonPhoneNumber(personPhoneNumberData: $personData) {
        ok
      }
    }
  `,

  UPDATE_PERSON_EXPERIENCE: gql`
    mutation updatePersonExperience($personData: UpdatePersonExperienceInput) {
      updatePersonExperience(personExperienceData: $personData) {
        ok
      }
    }
  `,

  UPDATE_PERSON_EDUCATION: gql`
    mutation updatePersonEducation($personData: UpdatePersonEducationInput) {
      updatePersonEducation(personEducationData: $personData) {
        ok
      }
    }
  `,

  UPDATE_PERSON_POSSESSION: gql`
    mutation updatePersonPossession($personData: UpdatePersonPossessionInput) {
      updatePersonPossession(personPossessionData: $personData) {
        ok
      }
    }
  `,

  UPDATE_PERSON_SKILL: gql`
    mutation updatePersonSkill($personData: UpdatePersonSkillInput) {
      updatePersonSkill(personSkillData: $personData) {
        ok
      }
    }
  `,

  UPDATE_PERSON_LANGUAGE: gql`
    mutation updatePersonLanguage($personData: UpdatePersonLanguageInput) {
      updatePersonLanguage(personLanguageData: $personData) {
        ok
      }
    }
  `,

  UPDATE_PERSON_INTEREST: gql`
    mutation updatePersonInterest($personData: UpdatePersonInterestInput) {
      updatePersonInterest(personInterestData: $personData) {
        ok
      }
    }
  `,

  UPDATE_PERSON_ACCOMPLISHMENT: gql`
    mutation updatePersonAccomplishment(
      $personData: UpdatePersonAccomplishmentInput
    ) {
      updatePersonAccomplishment(personAccomplishmentData: $personData) {
        ok
      }
    }
  `,

  UPDATE_PERSON_LICENSE_CERTIFICATE: gql`
    mutation updatePersonLicenseCertificate(
      $personData: UpdatePersonLicenseCertificateInput
    ) {
      updatePersonLicenseCertificate(
        personLicenseCertificateData: $personData
      ) {
        ok
      }
    }
  `,

  UPDATE_PERSON_VOLUNTEERING: gql`
    mutation updatePersonVolunteering($personData: UpdatePersonVolunteeringInput) {
      updatePersonVolunteering(personVolunteeringData: $personData) {
        ok
      }
    }
  `,

  UPDATE_PERSON_PUBLICATION: gql`
    mutation updatePersonPublication($personData: UpdatePersonPublicationInput) {
      updatePersonPublication(personPublicationData: $personData) {
        ok
      }
    }
  `,

  UPDATE_PERSON_AWARD: gql`
    mutation updatePersonAward($personData: UpdatePersonAwardInput) {
      updatePersonAward(personAwardData: $personData) {
        ok
      }
    }
  `,

  REMOVE_PERSON_ADDRESS: gql`
    mutation removePersonAddress($id: Int!) {
      removePersonAddress(id: $id) {
        ok
      }
    }
  `,

  REMOVE_PERSON_EMAIL: gql`
    mutation removePersonEmail($id: Int!) {
      removePersonEmail(id: $id) {
        ok
      }
    }
  `,

  REMOVE_PERSON_IMAGE: gql`
    mutation removePersonImage($id: Int!) {
      removePersonImage(id: $id) {
        ok
      }
    }
  `,

  REMOVE_PERSON_PHONE_NUMBER: gql`
    mutation removePersonPhoneNumber($id: Int!) {
      removePersonPhoneNumber(id: $id) {
        ok
      }
    }
  `,

  REMOVE_PERSON_EXPERIENCE: gql`
    mutation removePersonExperience($id: Int!) {
      removePersonExperience(id: $id) {
        ok
      }
    }
  `,

  REMOVE_PERSON_EDUCATION: gql`
    mutation removePersonEducation($id: Int!) {
      removePersonEducation(id: $id) {
        ok
      }
    }
  `,

  REMOVE_PERSON_POSSESSION: gql`
    mutation removePersonPossession($id: Int!) {
      removePersonPossession(id: $id) {
        ok
      }
    }
  `,

  REMOVE_PERSON_SKILL: gql`
    mutation removePersonSkill($id: Int!) {
      removePersonSkill(id: $id) {
        ok
      }
    }
  `,

  REMOVE_PERSON_LANGUAGE: gql`
    mutation removePersonLanguage($id: Int!) {
      removePersonLanguage(id: $id) {
        ok
      }
    }
  `,

  REMOVE_PERSON_INTEREST: gql`
    mutation removePersonInterest($id: Int!) {
      removePersonInterest(id: $id) {
        ok
      }
    }
  `,

  REMOVE_PERSON_ACCOMPLISHMENT: gql`
    mutation removePersonAccomplishment(
      $id: Int!
    ) {
      removePersonAccomplishment(id: $id) {
        ok
      }
    }
  `,

  REMOVE_PERSON_LICENSE_CERTIFICATE: gql`
    mutation removePersonLicenseCertificate(
      $id: Int!
    ) {
      removePersonLicenseCertificate(
        id: $id
      ) {
        ok
      }
    }
  `,

  REMOVE_PERSON_VOLUNTEERING: gql`
    mutation removePersonVolunteering($id: Int!) {
      removePersonVolunteering(id: $id) {
        ok
      }
    }
  `,

  REMOVE_PERSON_PUBLICATION: gql`
    mutation removePersonPublication($id: Int!) {
      removePersonPublication(id: $id) {
        ok
      }
    }
  `,

  REMOVE_PERSON_AWARD: gql`
    mutation removePersonAward($id: Int!) {
      removePersonAward(id: $id) {
        ok
      }
    }
  `,

}
