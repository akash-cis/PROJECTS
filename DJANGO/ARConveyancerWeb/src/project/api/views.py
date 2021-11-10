from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from django.shortcuts import render
from company.models import Company
from ..utils import decrypt
from ..models import Project
from .serializers import ProjectSerializer
from layer.api.serializers import LayerSerializer
from stage.api.serializers import StageSerializer
from stage.models import Stage
from layer.models import Layer

class ProjectAPIView(APIView):
    def get(self, request, pk=None, format=None):
        if pk:
            try:
                company = Company.objects.get(pk=pk)
                projects = Project.objects.filter(company=company)
                if projects.count() == 0:
                    return Response({'warning':'No projects found!'}, status=status.HTTP_204_NO_CONTENT)
                serializer = ProjectSerializer(projects, many=True)
                return Response(serializer.data, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({'error':'Company does not exist.'} , status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({'error':'Company must be selected to view the projects.'}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request, format=None):
        print(decrypt(request.data.get('id')))
        project_id = decrypt(request.data.get('id'))

        project = Project.objects.get(pk=project_id)
        stages = Stage.objects.filter(project=project_id, status=True)
        layers = Layer.objects.filter(project=project_id)

        project_serializer = ProjectSerializer(project)
        stage_serializer = StageSerializer(stages, many=True)
        layer_serializer = LayerSerializer(layers, many=True)
        print(stages)
        print(layers)

        serializer = {
            'project': project_serializer.data,
            'stages': stage_serializer.data,
            'layers': layer_serializer.data
        }
        
        return Response(serializer, status=status.HTTP_200_OK)