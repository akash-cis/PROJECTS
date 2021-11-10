from django.db.models import Q
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from ..models import Tradie
from company.models import Company
from company.api.serializers import CompanySerializer
from .serializers import (
    TradieSerializer, 
    TradieLoginSerializer, 
    TradieChangePasswordSerializer, 
    TradieForgetPasswordEmailSerializer,
    TradieResetPasswordSerializer,
)

from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string


class TradieAPIView(APIView):

    def get(self, request, pk=None, format=None):
        if pk:
            try:
                tradie = Tradie.objects.get(pk=pk)
                serializer = TradieSerializer(tradie)
                return Response(serializer.data)
            except Exception:
                return Response({'Error': 'Tradie does not exist!'}, status=status.HTTP_400_BAD_REQUEST)    
        tradie = Tradie.objects.all()
        serializer = TradieSerializer(tradie, many=True)
        return Response(serializer.data)

    def post(self, request, pk=None, format=None):
        serializer = TradieSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Tradie was created successfully!'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TradieLoginAPIView(APIView):

    def post(self, request, format=None):
        serializer = TradieLoginSerializer(data=request.data)
        if serializer.is_valid():
            tradies = Tradie.objects.filter(Q(email=serializer.validated_data['email']))
            if tradies.count() == 1:
                tradie = tradies[0]
                if not tradie.status:
                    return Response({'Error': 'This tradie is not active!'}, status=status.HTTP_400_BAD_REQUEST)

                if tradie.check_password(serializer.validated_data['password']):
                    print('---------data:', tradie.status)
                    company = Company.objects.get(pk=tradie.company.id)
                    return Response(CompanySerializer(company).data, status=status.HTTP_200_OK)
                else:
                    return Response({'Error': 'Your Email or Password is incorrect!'}, status=status.HTTP_400_BAD_REQUEST)
            elif tradies.count() >1:
                companies = []
                print(tradies)
                for tradie in tradies:
                    print(tradie)
                    print(tradie)
                    if tradie.status:
                        if tradie.check_password(serializer.validated_data['password']):
                            companies.append(Company.objects.get(pk=tradie.company.id))
                        else:
                            tradies.exclude(pk=tradie.id)
                if not companies:
                    return Response({'Error': 'Either Your Email or Password is incorrect or your tradie account has been deactivated!'}, status=status.HTTP_400_BAD_REQUEST)
                    
                return Response(CompanySerializer(companies, many=True).data, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'Tradie does not exist.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TradieLoginSelectCompany(APIView):

    def post(self, request, formant=None):
        try:
            tradie = Tradie.objects.get(email=request.data['email'], company=request.data['company'])
            serializer = TradieSerializer(tradie)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception:
            return Response({'error': 'Tradie does not exist.'}, status=status.HTTP_400_BAD_REQUEST)

        

class TradieChangePasswordAPIView(APIView):

    def post(self, request, format=None):
        if type(request.data['id']) == type(str()):
            if request.data['id'].isnumeric():
                id = request.data['id']
            else:
                return Response({'error': 'id is not valid.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            id = request.data['id']
        try:
            tradie = Tradie.objects.get(pk=id)
            serializer = TradieChangePasswordSerializer(tradie, data=request.data, partial=True)
            if serializer.is_valid():
                print('valid')
                serializer.save()
                return Response({'success':'Tradie password was updated successfully.'}, status=status.HTTP_200_OK)
            else:
                print('invalid')
                return Response(serializer.errors, status=status.HTTP_200_OK)
        except Exception:
            return Response({'error': 'Tradie does not exist.'}, status=status.HTTP_400_BAD_REQUEST)



class TradieForgetPasswordAPIView(APIView):
    serializer_class = TradieForgetPasswordEmailSerializer
    
    def post(self, request):
        print(request.data['email'])
        serializer = TradieForgetPasswordEmailSerializer(data=request.data)
        if serializer.is_valid():
            tradies = Tradie.objects.filter(email=request.data['email'])
            c_ids = []
            for tradie in tradies:
                c_ids.append(tradie.company.id)
            company = Company.objects.filter(pk__in=c_ids)
            serializer = CompanySerializer(company, many=True)
            print(serializer.data)

            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ForgetPasswordCompanySelectAPIView(APIView):

    def post(self, request):
        print(request.data)
        tradie = Tradie.objects.get(email= request.data['tradie'], company=request.data['company'])

        import random
        otp = random.randint(1000, 9999)
        try:
            # Rendering username and password into email.
            message = render_to_string('emails/tradie_forgot_password_email.html',{
                    'otp': otp,
                })

            # Sending forgot password email to the tradie.
            send_mail(
                subject='Your OTP to reset your password',
                message=message,
                html_message=message,
                from_email= settings.EMAIL_HOST_USER,
                recipient_list=[tradie.email, ],
                fail_silently=False,
            )
            return Response({'otp':otp,'tradie':tradie.id}, status=status.HTTP_200_OK)
        except Exception as e:
            print(e)
            return Response({'error':'Something went wrong while sending the email.'}, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetAPIView(APIView):

    def post(self, request):
        print(request.data['tradie'], request.data['password'])
        tradie = Tradie.objects.get(pk=request.data['tradie'])
        serializer = TradieResetPasswordSerializer(tradie, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'success':'Tradies password was reset successfully.'}, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        