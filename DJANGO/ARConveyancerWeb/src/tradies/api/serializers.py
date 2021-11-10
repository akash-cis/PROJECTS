from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from ..models import Tradie

class TradieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tradie 
        exclude = ('password',)

class TradieLoginSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tradie 
        fields = ['email','password']

class TradieChangePasswordSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    old_password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = Tradie
        fields = ('old_password', 'password', 'password2')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})

        return attrs

    def validate_old_password(self, value):
        tradie = self.instance
        if not tradie.check_password(value):
            raise serializers.ValidationError("Old password is not correct")
        return value

    def update(self, instance, validated_data):

        instance.set_password(validated_data['password'])
        instance.save()

        return instance


class TradieForgetPasswordEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()

    class Meta:
        fields = ['email']

    def validate(self, attrs):
        # try:
        email = attrs.get('email',None)
        import re
        pattern = re.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$")
        if not pattern.match(email):
            raise serializers.ValidationError('Email is not valid.')
        if not Tradie.objects.filter(email=email).exists():
            raise serializers.ValidationError('Tradie with this email address does not exist.')
        return attrs

class TradieResetPasswordSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = Tradie
        fields = ('password', 'password2')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})

        return attrs


    def update(self, instance, validated_data):

        instance.set_password(validated_data['password'])
        instance.save()

        return instance

